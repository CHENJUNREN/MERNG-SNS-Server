const { UserInputError, AuthenticationError } = require("apollo-server");
const { update } = require("../../models/Post");

const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");

module.exports = {
	Mutation: {
		createComment: async (_, { postId, body }, context) => {
			const { username } = checkAuth(context);

			if (body.trim() === "") {
				throw new UserInputError("Empty Error", {
					errors: {
						body: "Comment body must not be empty",
					},
				});
			}

			const post = await Post.findById(postId);
			if (post) {
				post.comments.unshift({
					body: body,
					username: username,
					createdAt: new Date().toISOString(),
				});
				const savedPost = await post.save();
				return savedPost;
			} else {
				throw new UserInputError("Post not found");
			}
		},
		deleteComment: async (_, { postId, commentId }, context) => {
			const { username } = checkAuth(context);

			const post = await Post.findById(postId);
			if (post) {
				const commentIndex = post.comments.findIndex(
					(element) => element.id === commentId
				);
				if (post.comments[commentIndex].username === username) {
					post.comments.splice(commentIndex, 1);
					const updatedPost = await post.save();
					return updatedPost;
				} else {
					throw new AuthenticationError("Action not allowed");
				}
			} else {
				throw new UserInputError("Post not found");
			}
		},
	},
};
