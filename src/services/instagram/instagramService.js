import { publishPost, toggleCommentVisibility, deleteComment, createComment, createReply } from "../../api/instagram/posts";
import { publishStory } from "../../api/instagram/stories";
import { fetchStoryInsights } from "../../api/instagram/insights";

export const fetchInstagramData = async (userId, username, accessToken) => {
  const response = await fetch(`http://localhost:8000/api/users?user_id=${encodeURIComponent(userId)}&username=${encodeURIComponent(username)}&access_token=${encodeURIComponent(accessToken)}&fields=media{media_type,media_url,children{media_type,media_url},media_product_type,like_count,comments_count},stories,tags`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
  }
  return response.json();
};

export { publishPost, publishStory, toggleCommentVisibility, deleteComment, createComment, createReply, fetchStoryInsights };