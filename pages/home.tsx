import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'
import { Database } from '../types/database'
import styles from "../styles/Styles.module.css"
import { GetServerSidePropsContext } from 'next'
import NavBarComponent from '@/components/NavBarComponent'  // imports the nav bar
import * as tf from '@tensorflow/tfjs';
import Link from 'next/link';

type Post = {
  id: number,
  created_at: string,
  title: string,
  authors: string[],
  abstract: string,
  pdf: string,
  embedding: number[],
  likes: number
}

export default function Home({ user, closestPosts }: { user: User, closestPosts: Post[] }) {
  const supabase = useSupabaseClient<Database>()
  const [posts, setPosts] = useState<Post[]>([])


  useEffect(() => {
    setPosts(closestPosts)
  }, [])

  const likePost = useCallback(async (postId : number) => {
    // Check if this user has already liked this post
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', user.id)
      .eq('post_id', postId);
  
    if (likesError) console.log('Error fetching likes: ', likesError)
    else if (likesData.length > 0) {
      console.log('User has already liked this post');
    } else {
      // Fetch the current number of likes for this post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('likes')
        .eq('id', postId);
  
      if (postError) console.log('Error fetching post: ', postError)
      else if (postData.length === 0) {
        console.log('No post found with this id');
      } else {
        const newLikes = postData[0].likes + 1;
  
        // Increment the likes for this post
        const { data: updateData, error: updateError } = await supabase
          .from('posts')
          .update({ likes: newLikes })
          .eq('id', postId);
  
        if (updateError) console.log('Error updating post: ', updateError)
        else {
          // Add a row to the likes table
          const { data: likesData, error: likesError } = await supabase
            .from('likes')
            .insert([
              { user_id: user.id, post_id: postId }
            ]);
  
          if (likesError) console.log('Error inserting like: ', likesError)
          else {
            console.log('Successfully liked post');
            // You might want to manually update the closestPosts state to reflect the new like
          }
        }
      }
    }
  }, [supabase, user.id]);

  return (
      <>
      <style jsx global>{`
        body {
          background-color: black;
        }
      `}</style>
      <div>
        <NavBarComponent />
        <div className={styles.container}>
          {/* nav bar */}
          {posts && posts.map((post, index) => (
            <div key={post.id} className={styles.post}>
              <Link href={`/${post.id}`}>
                <h2 className={styles.title}>{post.title}</h2>
              </Link>
              <h3 className={styles.author}>Author: {post.authors.join(', ')}</h3>
              <p className={styles.abstract}>{post.abstract}</p>
              <a href={post.pdf} className={styles.link}>View PDF</a>
              <button onClick={() => likePost(post.id)}>Like</button>
              <p>{post.likes} likes</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// A function to calculate the cosine similarity between two embeddings
async function cosineSimilarity(embedding1: number[], embedding2: number[]): Promise<number> {
  const a = tf.tensor1d(embedding1);
  const b = tf.tensor1d(embedding2);
  
  const magnitudeA = tf.norm(a);
  const magnitudeB = tf.norm(b);
  const dotProduct = tf.sum(tf.mul(a, b));
  
  const similarity = tf.div(dotProduct, tf.mul(magnitudeA, magnitudeB));

  return (await similarity.array()) as number; // Assert that the result is a number
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx)
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session)
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }

    const { data: userEmbeddingsData } = await supabase
    .from('user_embeddings')
    .select('*')
    .eq('user_id', session.user.id);

    // Fetch the post embeddings
    const { data: postEmbeddingsData } = await supabase
    .from('posts')
    .select('*');

    // For each post, calculate its maximum cosine similarity to the user embeddings
    const similarities = [];
    for (const post of postEmbeddingsData!) {
      let maxSimilarity = -Infinity;
      for (const userEmbedding of userEmbeddingsData!) {
        const similarity = await cosineSimilarity(userEmbedding.embedding, post.embedding);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
        }
    }
    similarities.push({ id: post.id, similarity: maxSimilarity });
    }

    // Sort the posts by similarity and take the first 100
    const closestPosts = similarities
    .sort((a, b) => b.similarity - a.similarity) // Note that we sort in descending order
    .slice(0, 5)
    .map(({ id }) => postEmbeddingsData!.find(post => post.id === id));

    const sortedByLikes = closestPosts.sort((a, b) => (b ? b.likes : 0) - (a ? a.likes : 0));

    return {
      props: {
        initialSession: session,
        user: session.user,
        closestPosts: sortedByLikes
      },
    }
}