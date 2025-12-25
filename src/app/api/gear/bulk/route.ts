import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import Papa from 'papaparse';
import { createGearSchema } from '@/lib/validations/gear';
import { withErrorHandler, ValidationError } from '@/lib/api-error-handler';
import { withRateLimit, rateLimitConfig } from '@/lib/rate-limit';
import { withMonitoring, trackDatabaseQuery } from '@/lib/monitoring';
import { logger } from '@/lib/logger';

export const POST = withErrorHandler(
  withMonitoring(
    withRateLimit(rateLimitConfig.general.limiter, rateLimitConfig.general.limit)(
      async (req: NextRequest) => {
        const cookieStore = cookies();
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
            }
          }
        );

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new ValidationError('Unauthorized');
        }

        const userId = session.user.id;
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          throw new ValidationError('No file uploaded');
        }

        const fileContent = await file.text();

        try {
          const parseResult = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
          });

          if (parseResult.errors.length > 0) {
            logger.error('CSV parsing errors', { errors: parseResult.errors }, 'API');
            throw new ValidationError('Error parsing CSV file', parseResult.errors);
          }

          const gearData = parseResult.data as any[];
          const results: { status: string; row: number; data: any; errors?: any }[] = [];
          let successCount = 0;
          let errorCount = 0;

          for (const [index, item] of gearData.entries()) {
            const rowNumber = index + 1;
            try {
              // Prepare data for validation, ensuring numeric types are coerced
              const processedItem = {
                ...item,
                dailyRate: item.dailyRate ? parseFloat(item.dailyRate) : undefined,
                weeklyRate: item.weeklyRate ? parseFloat(item.weeklyRate) : undefined,
                monthlyRate: item.monthlyRate ? parseFloat(item.monthlyRate) : undefined,
                replacementValue: item.replacementValue ? parseFloat(item.replacementValue) : undefined,
                insuranceRate: item.insuranceRate ? parseFloat(item.insuranceRate) : undefined,
                insuranceRequired: item.insuranceRequired ? item.insuranceRequired.toLowerCase() === 'true' : false,
                isAvailable: item.isAvailable ? item.isAvailable.toLowerCase() === 'true' : true,
                images: item.imageUrl ? [item.imageUrl] : [], // Use imageUrl from CSV, or empty array
              };

              const validatedGear = createGearSchema.parse(processedItem);

              await trackDatabaseQuery('gear.create', () =>
                prisma.gear.create({
                  data: {
                    ...validatedGear,
                    userId: userId,
                    // Ensure image field is handled correctly, potentially from CSV 'imageUrl' column
                    images: validatedGear.images ? JSON.stringify(validatedGear.images) : '[]',
                    insuranceRate: validatedGear.insuranceRate ?? 0.10, // Default if not provided
                  },
                })
              );
              results.push({ status: 'success', row: rowNumber, data: item });
              successCount++;
            } catch (validationError: any) {
              logger.warn('Validation failed for CSV row', { row: rowNumber, item, errors: validationError.errors }, 'API');
              results.push({
                status: 'error',
                row: rowNumber,
                data: item,
                errors: validationError.errors,
              });
              errorCount++;
            }
          }

          if (errorCount > 0) {
            return NextResponse.json(
              {
                message: `Bulk upload completed with ${successCount} successes and ${errorCount} errors.`,
                successCount,
                errorCount,
                results,
              },
              { status: 207 } // Multi-Status
            );
          }

          return NextResponse.json(
            { message: 'Bulk upload successful', successCount, errorCount, results },
            { status: 200 }
          );
        } catch (error: any) {
          logger.error('Error during bulk upload:', { error: error.message, stack: error.stack }, 'API');
          // Distinguish between validation errors and other errors
          if (error instanceof ValidationError) {
            throw error; // Re-throw to be handled by withErrorHandler
          }
          throw new Error('An unexpected error occurred during bulk upload.');
        }
      }
    )
  )
);
