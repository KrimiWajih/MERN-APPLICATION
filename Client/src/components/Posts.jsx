import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import PostUser from './PostUser'; // assuming this is the component to display a post
import PostUser1 from './PostUser1';

export default function SinglePost() {
  const { postID } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    const fetchPost = async () => {
      try {
        const response = await axios.get(`/api/posts/${postID}`, {
          withCredentials: true,
        });
        console.log(response.data)
        setPost(response.data.Post);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postID]);

  if (loading) return <p>Loading...</p>;
  if (!post) return <p>Post not found</p>;

  return (
    <div className="container mx-auto">
      <PostUser1 post={post} />
    </div>
  );
}
