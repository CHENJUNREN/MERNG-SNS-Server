const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");

module.exports = {
	Query: {
		getPosts: async () => {
			try {
				const posts = await Post.find().sort({ createdAt: -1 });
				return posts;
			} catch (err) {
				throw new Error(err);
			}
		},
		getPost: async (_, { postId }) => {
			try {
				const post = await Post.findById(postId);
				if (post) {
					return post;
				} else {
					throw new Error("Post not found");
				}
			} catch (err) {
				throw new Error(err);
			}
		},
	},
	Mutation: {
		createPost: async (_, { body }, context) => {
			const user = checkAuth(context);

			if (body.trim() === "") {
				throw new Error("Post body must not be empty");
			}

			const newPost = new Post({
				body,
				username: user.username,
				createdAt: new Date().toISOString(),
				user: user.id,
			});
			const post = await newPost.save();

			context.pubsub.publish("NEW_POST", {
				newPost: post,
			});

			return post;
		},
		deletePost: async (_, { postId }, context) => {
			const user = checkAuth(context);
			try {
				const post = await Post.findById(postId);
				if (!post) {
					throw new Error("Post not found");
				}
				if (user.username === post.username) {
					await post.delete();
					return "Post successfully deleted!";
				} else {
					throw new AuthenticationError("Action not allowed");
				}
			} catch (err) {
				throw new Error(err);
			}
		},
		likePost: async (_, { postId }, context) => {
			const { username } = checkAuth(context);

			const post = await Post.findById(postId);
			if (post) {
				if (
					post.likes.find((element) => element.username === username)
				) {
					// Post already liked, unlike it
					post.likes = post.likes.filter(
						(element) => element.username !== username
					);
				} else {
					// like the post
					post.likes.push({
						username,
						createdAt: new Date().toISOString(),
					});
				}
				const newPost = await post.save();
				return newPost;
			} else {
				throw new UserInputError("Post not found");
			}
		},
	},
	Subscription: {
		newPost: {
			subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
		},
	},
};
