/// <reference types="vite/client" />

// This is a simple helper for Cloudinary Unsigned Uploads
// You need to enable "Unsigned uploading" in your Cloudinary Settings -> Upload
// And use that "Upload Preset" name here.

export const CLOUDINARY_CONFIG = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ds2cmztyy",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ml_default",
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
    apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
};

const compressImage = async (file: File): Promise<File> => {
    // Skip compression for small files (e.g., < 500KB) or non-images
    if (file.size < 500 * 1024 || !file.type.startsWith("image/")) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Max dimension limit (e.g., 1920px)
            const MAX_SIZE = 1920;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                resolve(file); // Fallback to original
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a new file with the compressed blob
                        const compressedFile = new File([blob], file.name, {
                            type: "image/jpeg", // Convert to JPEG for better compression
                            lastModified: Date.now(),
                        });
                        console.log(`Compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                },
                "image/jpeg",
                0.8 // Quality (0.0 - 1.0)
            );
        };
        img.onerror = (err) => resolve(file); // Fallback
    });
};

export const uploadToCloudinary = async (file: File) => {
    // 1. Compress Image
    const fileToUpload = await compressImage(file);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error("Upload failed. Check your Cloudinary Config.");
        }

        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id
        };
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
};

const generateSHA1 = async (message: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
};

export const deleteFromCloudinary = async (publicId: string) => {
    if (!CLOUDINARY_CONFIG.apiKey || !CLOUDINARY_CONFIG.apiSecret) {
        console.error("Cloudinary Deletion Skipped: Missing API Key or Secret. Config:", {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            hasKey: !!CLOUDINARY_CONFIG.apiKey,
            hasSecret: !!CLOUDINARY_CONFIG.apiSecret
        });
        throw new Error("Missing Cloudinary API Key/Secret");
    }

    const timestamp = Math.round((new Date()).getTime() / 1000).toString();

    // Signature requires parameters sorted by name
    // paramsToSign: public_id, timestamp
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_CONFIG.apiSecret}`;
    const signature = await generateSHA1(paramsToSign);

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", CLOUDINARY_CONFIG.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errData = await response.json();
            console.error("Cloudinary API Error:", errData);
            throw new Error(errData.error?.message || "Deletion failed");
        }

        console.log("Cloudinary image deleted successfully");
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        throw error;
    }
};
