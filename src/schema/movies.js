const { z } = require("zod");

const GENDER_VALUES = [
	"Drama",
	"Action",
	"Crime",
	"Adventure",
	"Sci-Fi",
	"Romance",
	"Animation",
	"Biography",
	"Fantasy",
];

const movieSchema = z.object({
	title: z
		.string({
			invalid_type_error: "Movie title must be a string",
			required_error: "Movie title is required",
		})
		.trim(),
	year: z.number({}).int().positive().min(1900).max(2025),
	director: z.string(),
	duration: z.number().int().positive(),
	poster: z.string().url(),
	genre: z.string({ invalid_type_error: "" }).array(z.enum(GENDER_VALUES), {
		required_error: "",
		invalid_type_error: "",
	}),

	rate: z.number().min(0).max(10).default(0),
});

function validateMovie(object) {
	return movieSchema.safeParse(object);
}

function validatePartialMovie(input) {
	return movieSchema.partial().safeParse(input);
}

module.exports = {
	validateMovie,
	validatePartialMovie,
};
