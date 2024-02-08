const API_URL = "http://localhost:3000/movies";

function getMovies(apiUrl) {
	fetch(apiUrl)
		.then((res) => res.json())
		.then((movies) => {
			const html = movies
				.map(
					(movie) => `
          <article data-id="${movie.id}">
            <div>
              <h2>${movie.title}</h2>
              <p>${movie.director}</p>
            </div>

            <div class="img">
              <img src=${movie.poster} alt=${movie.title}/>
            </div>

            <button>Eliminar</button>
          </article>`
				)
				.join("");

			document.querySelector(".main").innerHTML = html;

			document.addEventListener("click", (ev) => {
				if (ev.target.matches("button")) {
					const article = ev.target.closest("article");
					const id = article.dataset.id;

					fetch(`${API_URL}/${id}`, {
						method: "DELETE",
					}).then((res) => {
						if (res.ok) {
							article.remove();
						}
					});
				}
			});
		});
}

getMovies(API_URL);
