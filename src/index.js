const express = require("express");
const crypto = require("node:crypto");
const cors = require("cors");

const movies = require("./data/movies.json");
const { validateMovie, validatePartialMovie } = require("./schema/movies");

const app = express();

app.disable("x-powered-by");
app.use(express.json());

const PORT = process.env.PORT ?? 4200 ?? 3000;

/**
 * + Métodos con el tema de CORS
 * --> métodos normales: GET | HEAD | POST
 * --> métodos complejos: PUT | PATCH | DELETE
 * con los métodos complejos existe algo que se llama "CORS PRE-Flight"
 * el "cors pre-flight" indica que requiere de una petición especial,
 * que es una petición OPTIONS(es un peticón previa),
 * este se ejecuta antes de ejecuta entes de realizar el PUT | PATCH | DELETE.
 * # Pero existe una librería "cors" que soluciona el tema de cors, pero vale tener cuidado, por que da acceso a todos los dominio de origen para hacer peticiones.
 */

/**
 * + Implementando libería cors
 */

app.use(
	cors({
		origin: (origin, cb) => {
			const ACCEPTED_ORIGINS = [
				"http://localhost:8080",
				"http://localhost:53033",
				"http://localhost:3000",
				"http://localhost:4200",
				"https://movies.com",
				"https://midudev.com",
			];

			if (ACCEPTED_ORIGINS.includes(origin)) {
				return cb(null, true);
			}

			if (!origin) {
				return cb(null, true);
			}

			return cb(new Error("Not allowed by CORS"));
		},
	})
);

/**
 * + Todos los recurso que sean MOVIES se identifican con [/movies]
 * /movies
 */

const ACCEPTED_ORIGINS = [
	"http://localhost:8080",
	"http://localhost:50426",
	"http://localhost:3000",
	"http://localhost:4200",
	"https://movies.com",
	"https://midudev.com",
];

app.get("/api/movies", (req, res) => {
	/**
	 * Cuando indicamos el *, estamos dando acceso a todos los dominio de origen para que haga petición.
	 * Cuando expecificamos un ruta (http://localhost:50426), solo ese dominio de origen podría hacer peticiones y obtendría respuesta.
	 * También podemos tener distintos dominio de origen(rutas=ACCEPTED_ORIGINS) especificos las cuales pueden hacer peticiones.
	 * Cuando ser realiza peticiones del mismo origen (ruta) este no envía el header con el "origin"
	 */

	// res.header("Access-Control-Allow-Origin", "*");

	// res.header("Access-Control-Allow-Origin", "http://localhost:50426");

	const origin = req.header("origin");

	// Cuando la petición es del mismo ORIGIN (no envía la cabecera de origin)
	// http://localhost:3000 --> http://localhost:3000

	// if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
	if (ACCEPTED_ORIGINS.includes(origin)) {
		res.header("Access-Control-Allow-Origin", origin);
	}

	res.json(movies);
});

/**
 * + query params: genre
 * /movies/search?genre='nombre_genero'
 */

/*
  app.get("/movies", (req, res) => {
    const { genre } = req.query;

    if (!genre) return res.send({ message: "No hay parámetro" });

    const filteredMovies = movies.filter((movie) => movie.genre.includes(genre));

    res.json(filteredMovies);
  });
*/

/**
 * + query params: genre
 * /movies/search?genre='nombre_genero'
 */

app.get("/api/movies/search", (req, res) => {
	const { genre } = req.query;

	if (!genre) return res.status(400).send({ message: "No hay parámetro" });

	// const filteredMovies = movies.filter((movie) => movie.genre.includes(genre));
	const filteredMovies = movies.filter((movie) =>
		movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
	);

	res.send(filteredMovies);
});

/**
 * + GET
 * # El recurso que se identifica con params: id
 * /movies/:id
 */
app.get("/api/movies/:id", (req, res) => {
	const { id } = req.params;
	const movie = movies.find((movie) => movie.id === id);

	if (!movie) return res.status(404).json({ message: "Movie not found" });
	res.json(movie);
});

/**
 * + POST
 * # Creando un recurso a /movies
 * Haciendo uso del módulo nativo "crypto" de node para crear id
 */

/*
  app.post("/movies", (req, res) => {
    const { body } = req;
    const { title, year, director, duration, poster, genre, rate } = body;
    const newMovie = {
      id: crypto.randomUUID(), //genera un uuid v4
      title,
      year,
      director,
      duration,
      poster,
      genre,
      rate: rate ?? 0,
    };

    res.status(201).send(newMovie);
  });
  */

/**
 * + POST
 * # Creando un recurso a /movies
 * Haciendo uso del módulo nativo "crypto" de node para crear id
 * Implementando zod para validar datos
 */

app.post("/api/movies", (req, res) => {
	const { body } = req;
	const result = validateMovie(body);
	// const {success, error, data} = validateMovie(body)

	if (result.error) {
		return res.status(400).json({ error: JSON.parse(result.error.message) });
	}

	const newMovie = {
		id: crypto.randomUUID(), //genera un uuid v4
		...result.data,
	};

	res.status(201).send(newMovie);
});

/**
 * + PATCH
 * # Actualizando una película
 */

app.patch("/api/movies/:id", (req, res) => {
	const { id } = req.params;
	const result = validatePartialMovie(req.body);

	if (!result.success) {
		return res.status(400).json({ error: JSON.parse(result.error.message) });
	}

	const movieIndex = movies.findIndex((movie) => movie.id === id);

	if (movieIndex === -1)
		return res.status(404).json({ message: "Movie not found" });

	const updateMovie = { ...movies[movieIndex], ...result.data };
	movies[movieIndex] = updateMovie;

	return res.json(updateMovie);
});

/**
 * + DELETE
 * # Eliminar un recurso(película)
 */

app.delete("/api/movies/:id", (req, res) => {
	const origin = req.header("origin");
	const { id } = req.params;

	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
		res.header("Access-Control-Allow-Origin", origin);
	}

	const movieIndex = movies.findIndex((movie) => movie.id === id);

	if (movieIndex === -1)
		return res.status(404).json({ message: "Movie not found" });

	movies.splice(movieIndex, 1);
	return res.json({ message: "Movie deleted" });
});

/**
 * + OPTIONS (esto no es necesario cuando usamos la librería cors)
 * es una petición previa que se realiza antes de los métodos
 * PUT | DELETE | PATCH
 */

app.options("/api/movies/:id", (req, res) => {
	const origin = req.header("origin");

	if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
		res.header("Access-Control-Allow-Origin", origin);
		res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
	}

	return res.send(200);
});

app.use((req, res) => {
	res.status(404).send("Recurso no encontrado!");
});

app.listen(PORT, () => {
	console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
