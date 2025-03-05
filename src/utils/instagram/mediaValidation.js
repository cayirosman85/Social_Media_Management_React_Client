export const validateMediaDimensions = (file, isStory = false) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const isImage = ["jpg", "jpeg"].includes(fileExtension);
      const isVideo = ["mp4", "mov"].includes(fileExtension);
  
      if (isImage) {
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const aspectRatio = width / height;
  
          if (isStory) {
            if (width < 320 || width > 1080) {
              reject(new Error(`Story image width must be between 320px and 1080px, got: ${width}px`));
            }
            if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
              reject(new Error(`Story image aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
            }
          } else {
            if (width < 320 || width > 1440) {
              reject(new Error(`Image width must be between 320px and 1440px, got: ${width}px`));
            }
            if (aspectRatio < 0.8 || aspectRatio > 1.91) {
              reject(new Error(`Image aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
            }
          }
          resolve();
        };
        img.onerror = () => reject(new Error("Failed to load image for validation"));
        img.src = URL.createObjectURL(file);
      } else if (isVideo) {
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          const width = video.videoWidth;
          const height = video.videoHeight;
          const aspectRatio = width / height;
  
          if (isStory) {
            if (width < 320 || width > 1080) {
              reject(new Error(`Story video width must be between 320px and 1080px, got: ${width}px`));
            }
            if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
              reject(new Error(`Story video aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
            }
          } else {
            if (width < 320 || width > 1440) {
              reject(new Error(`Video width must be between 320px and 1440px, got: ${width}px`));
            }
            if (aspectRatio < 0.8 || aspectRatio > 1.91) {
              reject(new Error(`Video aspect ratio must be between 0.8 (4:5) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
            }
          }
          resolve();
        };
        video.onerror = () => reject(new Error("Failed to load video for validation"));
        video.src = URL.createObjectURL(file);
      } else {
        reject(new Error("Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos."));
      }
    });
  };
  
  export const validateFileSize = (file, isStory = false) => {
    const fileSizeMB = file.size / (1024 * 1024);
    const isImage = ["jpg", "jpeg"].includes(file.name.split(".").pop().toLowerCase());
    const isVideo = ["mp4", "mov"].includes(file.name.split(".").pop().toLowerCase());
  
    if (isImage) {
      if (fileSizeMB > (isStory ? 8 : 8)) {
        throw new Error(`Image file size exceeds ${isStory ? "8" : "8"} MB limit: ${fileSizeMB.toFixed(2)} MB`);
      }
    } else if (isVideo) {
      if (fileSizeMB > (isStory ? 4 * 1024 : 4 * 1024)) {
        throw new Error(`Video file size exceeds ${isStory ? "4 GB" : "4 GB"} limit: ${(fileSizeMB / 1024).toFixed(2)} GB`);
      }
    }
    return true;
  };