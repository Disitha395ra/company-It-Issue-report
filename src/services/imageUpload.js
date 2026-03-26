/**
 * Image upload service using ImgBB free API
 * Alternative: Use Google Drive via Apps Script
 * For production, replace with your own storage solution
 */

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '';

/**
 * Compress file to base64 string
 */
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to jpeg format 0.5 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                const base64 = dataUrl.split(',')[1];
                resolve({ base64, dataUrl });
            };
            img.onerror = () => reject(new Error("Failed to load image for compression"));
        };
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Upload image to ImgBB or return base64 data URL as fallback
 */
export async function uploadImage(file) {
    if (!file) return '';

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit.');
    }

    try {
        // If ImgBB API key is available, use it
        if (IMGBB_API_KEY) {
            const { base64 } = await compressImage(file);
            const formData = new FormData();
            formData.append('key', IMGBB_API_KEY);
            formData.append('image', base64);

            const response = await fetch('https://api.imgbb.com/1/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                return result.data.url;
            }
            throw new Error('Upload failed');
        }

        // Fallback: convert to base64 data URL (stored as text in sheet)
        const { dataUrl } = await compressImage(file);
        return dataUrl;
    } catch (error) {
        console.error('Image upload error:', error);
        // Final fallback: return empty string
        return '';
    }
}

export default uploadImage;
