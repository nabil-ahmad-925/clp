import 'server-only';
import type { BlogPost } from './types';
import { pageStore } from './data';
import posts from './data/posts.json';

/** Blog posts, keyed by path (e.g. "/be-my-guest/"). */
const store = pageStore<BlogPost>(posts as Record<string, Omit<BlogPost, 'path'>>);

export const getPost = store.get;
export const postPaths = store.paths;
