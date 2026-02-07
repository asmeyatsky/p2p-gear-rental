#!/bin/bash
# Downloads seed images from Unsplash for each gear category
# Each image is downloaded at 800x600 from Unsplash's CDN
# Compatible with macOS bash 3.x (no associative arrays)

SEED_DIR="$(cd "$(dirname "$0")" && pwd)/seed-images"
mkdir -p "$SEED_DIR"/{cameras,lenses,lighting,audio,drones,tripods,monitors,accessories}

SUCCESS=0
FAIL=0

resolve_and_download() {
    local slug="$1"
    local output="$2"

    if [ -f "$output" ] && [ -s "$output" ]; then
        echo "  SKIP  $(basename "$(dirname "$output")")/$(basename "$output") (exists)"
        SUCCESS=$((SUCCESS + 1))
        return 0
    fi

    local cdn_url
    cdn_url=$(curl -s -L "https://unsplash.com/photos/$slug" | grep -o 'https://images\.unsplash\.com/[^"?]*' | head -1)

    if [ -z "$cdn_url" ]; then
        echo "  FAIL  Could not resolve CDN URL for slug: $slug"
        FAIL=$((FAIL + 1))
        return 1
    fi

    curl -s -L -o "$output" "${cdn_url}?w=800&h=600&fit=crop&auto=format&q=80"

    local filetype
    filetype=$(file -b "$output" | head -1)
    if echo "$filetype" | grep -q "JPEG\|image"; then
        echo "  OK    $(basename "$(dirname "$output")")/$(basename "$output")"
        SUCCESS=$((SUCCESS + 1))
        return 0
    else
        echo "  FAIL  $(basename "$(dirname "$output")")/$(basename "$output") (not an image)"
        rm -f "$output"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

download_category() {
    local category="$1"
    shift
    local slugs=("$@")

    echo "[$category] (${#slugs[@]} images)"
    local idx=1
    for slug in "${slugs[@]}"; do
        resolve_and_download "$slug" "$SEED_DIR/$category/${idx}.jpg"
        idx=$((idx + 1))
        sleep 0.3
    done
    echo ""
}

echo "Downloading seed images from Unsplash..."
echo "Target: 10 images per category, 8 categories = 80 images"
echo ""

download_category "cameras" \
    L8cF2Gp_uRA YWNAXxi9GL8 bA8FuWqF0Pw HSXIp58yPyI g1dqNiSZ_g0 \
    EXf5DjXytZE Stl7Eh0_lZE HvtzQg_6T_c U-UFbT9SsQ4 fBwNDRgig_w

download_category "lenses" \
    dbOdJnPorZk 0boMLXZif2o 7IBigEuL9Tw mNr-14ErMjc QCp1SboQ2Es \
    EKjJSbVI7rk emytwuBk5a0 M6QEPKIt0Qc 9rTwYexYgJw 9wYdW55NbnY

download_category "lighting" \
    gUZxwVQFrE8 PdbUq75g5gk NQ54PxKv-Q4 TUH9hhgUAG4 ih53NbkpLwc \
    qQzw8jPvip8 4QPsMAV3ILY ehWVzBFsNI4 l25AjzBDS8Q EUsVwEOsblE

download_category "audio" \
    kzbvhLjxygs 63sI4HO30tw YDdZ6nbGS24 KVlcVi-Ulgo mGHjp8AJOGg \
    2Vv-62upQos UUPpu2sYV6E 5ULLwpOS5V8 nQ5_vWts4eI _mugHa5Fc3M

download_category "drones" \
    H5IXIH254AU f0uUT7oKghQ 0VfnZbQd98c Iz9u6T3VMIk gBy985PKkpQ \
    f-OXUlmT4_U WfpRMwkvwK0 e3hH6_pSk1g EXtfJvPW9SQ CzQWJyZdFzU

download_category "tripods" \
    pdBsg-29fq8 _L2fCpshB4s NZFBXRoFNaA tjh0UsYQOpE Y-njUgtUH40 \
    WwJEicqu9pI Zlz1R2cZIg4 jqII4yh4LGA w3WwUqNIHMk _QDNyo5_T24

download_category "monitors" \
    ZK6pSQ-yYJ4 E7eFxsHWVI0 ycExgCMRggc 57FbGQi54tA na8R4tWL73I \
    CPhGkJIN8nA vNHP_TK5_JQ zE3jMxLFCIg IhtvNgu1Oi4 GtxIrqVcPBY

download_category "accessories" \
    4Zjzhs6BPZM I5VNSTdBGHE qtKVfAdF3_s S7QSbNIyKmI dMMRWIOT8V0 \
    _EYKYjhSeHw Be6CbxPcQ6g XkvV4SS6GY4 I4YsI1zWq_w uIRRwfdnDIQ

echo "========================================="
echo "Download complete!"
echo "  Success: $SUCCESS"
echo "  Failed:  $FAIL"
echo "========================================="

# Show file sizes
echo ""
echo "Files by category:"
for cat in cameras lenses lighting audio drones tripods monitors accessories; do
    count=$(ls -1 "$SEED_DIR/$cat"/*.jpg 2>/dev/null | wc -l | tr -d ' ')
    size=$(du -sh "$SEED_DIR/$cat" 2>/dev/null | cut -f1)
    echo "  $cat: $count files ($size)"
done
