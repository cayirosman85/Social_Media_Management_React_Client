import { publishPost, toggleCommentVisibility, deleteComment, createComment, createReply ,getProfileInsights,getUserPosts,getMediaInsights,fetchInstagramData} from "../../api/instagram/posts";
import { publishStory } from "../../api/instagram/stories";
import { getRecentMedia,getTopMedia,searchHashtag ,getRecentSearchHashtags} from "../../api/instagram/hashtag";

import { fetchStoryInsights ,fetchStories } from "../../api/instagram/stories";


export { 
  publishPost, 
  publishStory, 
  toggleCommentVisibility, 
  deleteComment, 
  createComment, 
  createReply, 
  fetchStoryInsights ,
  getUserPosts,getMediaInsights,
  fetchInstagramData,
  fetchStories,
  getRecentMedia,
  getTopMedia
  ,searchHashtag,getRecentSearchHashtags,getProfileInsights
};