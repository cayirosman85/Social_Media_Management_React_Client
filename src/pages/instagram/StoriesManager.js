import React, { useState, useEffect } from "react";
import InstagramStory from "../../components/instagram/InstagramStory";
import NewPostModal from "../../components/instagram/NewPostModal";
import { fetchInstagramData, publishStory } from "../../services/instagram/instagramService";

const StoriesManager = ({ instagramData }) => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);

  useEffect(() => {
    if (instagramData) {
      setIsLoading(true);
      fetchInstagramData(
        "17841473036355290",
        "osmancayir73",
        "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
      )
        .then((data) => setStories(data.business_discovery.stories.data))
        .catch((error) => console.error("Error fetching stories:", error))
        .finally(() => setIsLoading(false));
    }
  }, [instagramData]);

  const handleNewStorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const mediaFile = formData.get("mediaFile");
    const mediaUrl = formData.get("mediaUrl")?.trim();

    try {
      let storyData = {
        user_id: "17841473036355290",
        access_token: "EAAZAde8LZA8zIBO6PGvN672KLJ8x0dBFwrlXnicLFSwhMXSBVepQZBMlVJlAcM1Ul8mfcDqBx0QggGCE1LruXvApOiyNidYdC0hlLsuoz8m33FD3PDkDFqyzfSEVCO55gL3ZB3lQe1Q9AKq1omGkZCvES7Q9j5qv0g4tAem52QzFr0fBwMr4mjUUWB0y1GHjjpwZDZD",
      };

      if (!mediaFile && !mediaUrl) {
        throw new Error("Please provide either a media file or a media URL.");
      }

      let finalIsImage, finalIsVideo;
      if (mediaUrl) {
        const urlExtension = mediaUrl.split(".").pop().toLowerCase();
        finalIsImage = ["jpg", "jpeg"].includes(urlExtension);
        finalIsVideo = ["mp4", "mov"].includes(urlExtension);

        if (!finalIsImage && !finalIsVideo) {
          throw new Error("Unsupported URL media type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        if (finalIsImage) storyData.image_url = mediaUrl;
        else if (finalIsVideo) storyData.video_url = mediaUrl;
      } else if (mediaFile) {
        const fileExtension = mediaFile.name.split(".").pop().toLowerCase();
        const isImageUpload = ["jpg", "jpeg"].includes(fileExtension);
        const isVideoUpload = ["mp4", "mov"].includes(fileExtension);

        if (!isImageUpload && !isVideoUpload) {
          throw new Error("Unsupported file type. Use JPG/JPEG for images or MP4/MOV for videos.");
        }

        const fileSizeMB = mediaFile.size / (1024 * 1024);
        if (isImageUpload && fileSizeMB > 8) {
          throw new Error(`Image file size exceeds 8 MB limit: ${fileSizeMB.toFixed(2)} MB`);
        }
        if (isVideoUpload && fileSizeMB > 4 * 1024) {
          throw new Error(`Video file size exceeds 4 GB limit: ${(fileSizeMB / 1024).toFixed(2)} GB`);
        }

        const validateMediaDimensions = (file) => {
          return new Promise((resolve, reject) => {
            if (isImageUpload) {
              const img = new Image();
              img.onload = () => {
                const width = img.width;
                const height = img.height;
                const aspectRatio = width / height;

                if (width < 320 || width > 1080) {
                  reject(new Error(`Story image width must be between 320px and 1080px, got: ${width}px`));
                }
                if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
                  reject(new Error(`Story image aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                }
                resolve();
              };
              img.onerror = () => reject(new Error("Failed to load image for validation"));
              img.src = URL.createObjectURL(file);
            } else if (isVideoUpload) {
              const video = document.createElement("video");
              video.onloadedmetadata = () => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                const aspectRatio = width / height;

                if (width < 320 || width > 1080) {
                  reject(new Error(`Story video width must be between 320px and 1080px, got: ${width}px`));
                }
                if (aspectRatio < 0.5625 || aspectRatio > 1.91) {
                  reject(new Error(`Story video aspect ratio must be between 0.5625 (9:16) and 1.91 (1.91:1), got: ${aspectRatio.toFixed(2)}`));
                }
                resolve();
              };
              video.onerror = () => reject(new Error("Failed to load video for validation"));
              video.src = URL.createObjectURL(file);
            }
          });
        };

        await validateMediaDimensions(mediaFile);

        const uploadFormData = new FormData();
        uploadFormData.append("mediaFile", mediaFile);
        const uploadResponse = await fetch("http://localhost:8000/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Failed to upload media: ${errorText}`);
        }
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.error);

        const url = uploadData.url;
        const finalExtension = url.split(".").pop().toLowerCase();
        finalIsImage = ["jpg", "jpeg"].includes(finalExtension);
        finalIsVideo = ["mp4", "mov"].includes(finalExtension);

        if (finalIsImage) storyData.image_url = url;
        else if (finalIsVideo) storyData.video_url = url;
      }

      const result = await publishStory(storyData);
      if (result.success) {
        fetchInstagramData(
          "17841473036355290",
          "osmancayir73",
          "EAAZAde8LZA8zIBO4O8QsOQmyMMMShi79cCZBMRJZCjbSbXG7Y3ZAQ4OGvJN1vi8LYLeNx6K9pbxpFuU2saC3lWWt43za1ggpCu9YONtmCuwucaWVgtYYqRcG2oMtuHPhxq6x4n3ImiE3TzXf4IzMHxMtuDbwNfT52ZA6yjkwWabhrLZCrb7zqWzdkjZBApQJmNntUgZDZD"
        ).then((data) => setStories(data.business_discovery.stories.data));
        setShowNewStoryModal(false);
        alert("Story published successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error publishing story:", error);
      // Handle error (e.g., setErrorModalMessage in parent or context)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="media-feed">
      <button onClick={() => setShowNewStoryModal(true)}>Create New Story</button>
      <div className="media-grid">
        {stories.map((story, index) => (
          <div key={story.id} className="media-item" onClick={() => setSelectedStoryIndex(index)}>
            <img src={story.media_url} alt="Story" className="media-img" />
          </div>
        ))}
      </div>
      {showNewStoryModal && (
        <NewPostModal
          onSubmit={handleNewStorySubmit}
          isLoading={isLoading}
          onClose={() => setShowNewStoryModal(false)}
        />
      )}
      {selectedStoryIndex !== null && (
        <InstagramStory
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
          instagramData={instagramData}
        />
      )}
    </div>
  );
};

export default StoriesManager;