import React, { useState, useEffect } from "react";
import InstagramStory from "../../components/instagram/InstagramStory";
import NewPostModal from "../../components/instagram/NewPostModal";
import { fetchStories, publishStory } from "../../services/instagram/instagramService";

const StoriesManager = ({ instagramData }) => {
  const [stories, setStories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewStoryModal, setShowNewStoryModal] = useState(false);
  const [showStoriesModal, setShowStoriesModal] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(null);

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      try {
        const userId = instagramData?.user_id || "17841473036355290";
        const accessToken = instagramData?.access_token || "EAAZAde8LZA8zIBO6PGvN672KLJ8x0dBFwrlXnicLFSwhMXSBVepQZBMlVJlAcM1Ul8mfcDqBx0QggGCE1LruXvApOiyNidYdC0hlLsuoz8m33FD3PDkDFqyzfSEVCO55gL3ZB3lQe1Q9AKq1omGkZCvES7Q9j5qv0g4tAem52QzFr0fBwMr4mjUUWB0y1GHjjpwZDZD";

        const response = await fetchStories(userId, accessToken);
        if (response.success) {
          setStories(response.stories || []);
          console.log("Stories fetched successfully:", response.stories);
        } else {
          throw new Error(response.error || "Failed to fetch stories");
        }
      } catch (error) {
        console.error("Error fetching stories:", error.message);
        setStories([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadStories();
  }, [instagramData]);

  const handleNewStorySubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target);
    const mediaFile = formData.get("mediaFile");
    const mediaUrl = formData.get("mediaUrl")?.trim();

    try {
      let storyData = {
        user_id: instagramData?.user_id || "17841473036355290",
        access_token: instagramData?.access_token || "EAAZAde8LZA8zIBO6PGvN672KLJ8x0dBFwrlXnicLFSwhMXSBVepQZBMlVJlAcM1Ul8mfcDqBx0QggGCE1LruXvApOiyNidYdC0hlLsuoz8m33FD3PDkDFqyzfSEVCO55gL3ZB3lQe1Q9AKq1omGkZCvES7Q9j5qv0g4tAem52QzFr0fBwMr4mjUUWB0y1GHjjpwZDZD",
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
        const response = await fetchStories(storyData.user_id, storyData.access_token);
        if (response.success) {
          setStories(response.stories || []);
        }
        setShowNewStoryModal(false);
        alert("Story published successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Error publishing story:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryClick = (index) => {
    setSelectedStoryIndex(index);
    setShowStoriesModal(true);
  };

  return (
    <div className="stories-manager">
      <style>
        {`
          .stories-manager {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .stories-manager-button {
            background-color: #0095f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
          }

          .stories-manager-button:hover {
            background-color: #007bb5;
          }

          .stories-manager-cards {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }

          .stories-manager-card {
            width: 100px;
            height: 150px;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s;
            position: relative;
          }

          .stories-manager-card:hover {
            transform: scale(1.05);
          }

          .stories-manager-card-img,
          .stories-manager-card-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .stories-manager-card-video {
            pointer-events: none; /* Prevents video controls from appearing on hover */
          }

          .stories-manager-message {
            font-size: 16px;
            color: #666;
            text-align: center;
          }
        `}
      </style>

      <button className="stories-manager-button" onClick={() => setShowNewStoryModal(true)}>
        Create New Story
      </button>
      {isLoading && <p className="stories-manager-message">Loading stories...</p>}
      {!isLoading && stories.length === 0 && (
        <p className="stories-manager-message">No stories available.</p>
      )}
      {!isLoading && stories.length > 0 && (
        <div className="stories-manager-cards">
          {stories.map((story, index) => (
            <div
              key={story.id}
              className="stories-manager-card"
              onClick={() => handleStoryClick(index)}
            >
              {story.media_type === "VIDEO" ? (
                <video
                  src={story.media_url}
                  className="stories-manager-card-video"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={story.media_url}
                  alt="Story thumbnail"
                  className="stories-manager-card-img"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {showNewStoryModal && (
        <NewPostModal
          onSubmit={handleNewStorySubmit}
          isLoading={isLoading}
          onClose={() => setShowNewStoryModal(false)}
        />
      )}
      {showStoriesModal && (
        <InstagramStory
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoriesModal(false)}
          instagramData={instagramData}
        />
      )}
    </div>
  );
};

export default StoriesManager;