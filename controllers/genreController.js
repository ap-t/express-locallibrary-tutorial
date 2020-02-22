var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const validator = require('express-validator');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
	Genre.find()
		.sort([['name','ascending']])
		.exec(function (err, list_genres) {
			if (err) return next(err);
			res.render('genre_list', { title: 'Genre List', genre_list: list_genres});
		});
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.params.id)
				.exec(callback);
		},
		genre_books: function (callback) {
			Book.find({ 'genre': req.params.id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) return next(err);
		if (results.genre == null) { // No results
			var err = new Error('Genre not found');
			err.status = 400;
			return next(err);
		}
		// Successfull, so render
		res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
	});
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
	res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
	// Validate that name field is not empty
	validator.body('name', 'Genre name required').trim().isLength({ min: 1 }),

	// Sanitize (escape) the name field.
	validator.sanitizeBody('name').escape(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validator.validationResult(req);

		// Create a genre object with escaped and trimmed data.
		var genre = new Genre({name: req.body.name});

		if (!errors.isEmpty()) {
			// There are errors. Render the form again with sanitized values/error messages.
			res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()})
		} else {
			// Data from form is valid.
			// Check if Genre with same name already exits.
			Genre.findOne({'name': req.body.name})
				.exec(function (err, found_genre) {
					if (err) return next(err);

					if (found_genre) {
						// Genre exits, redirect to its detail page.
						res.redirect(found_genre.url);
					} else {
						genre.save(function (err) {
							if (err) return next(err);
							// Genre saved. Redirect to genre detail page.
							res.redirect(genre.url);
						})
					}
				});
		}
	}
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.params.id)
				.exec(callback);
		}, 
		genre_books: function (callback) {
			Book.find({ 'genre': req.params.id })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) return next(err);
		if (results.genre === null) { // No results.
			res.redirect('/catalog/genres');
		}
		// Successful, so render
		res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
	})
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.body.genreid)
				.exec(callback);
		},
		genre_books: function (callback) {
			Book.find({ 'genre': req.body.genreid })
				.exec(callback);
		}
	}, function (err, results) {
		if (err) return next(err);
		// Success
		if (results.genre_books.length > 0) {
			// Genre has books. Render in the same ways as for GET route
			res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books });
			return;
		}
		// Genre has no books. Delete object and redirecto the list of genres.
		Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
			if (err) return next(err);
			// Success - go to genre list
			res.redirect('/catalog/genres');
		})
	});
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
	Genre.findById(req.params.id)
		.exec(function (err, genre) {
			if (err) return next(err);
			res.render('genre_form', {title: 'Update Genre', genre: genre});
		});
};

// Handle Genre update on POST.
exports.genre_update_post = [
	// Validate fields
	validator.body('name', 'Name must be specified').trim().isLength({min: 1}),

	// Sanitize fields
	validator.sanitizeBody('name').escape(),

	// Process request after validation and sanitization
	(req, res, next) => {
		// Extract the validation errors from a request.
		const errors = validator.validationResult(req);

		// Create a genre object with escaped and trimmed data.
		var genre = new Genre({name: req.body.name, _id: req.params.id });

		if (!errors.isEmpty()) {
			Genre.findById(req.params.id)
				.exec(function (err, genre) {
					if (err) return next(err);
					res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors});
			});
			return;
		} else {
			// Data from form is valid.
			async.waterfall([
				function (callback) {
					Genre.findOne({'name': req.body.name})
						.exec(function (err, found_genre) {
							callback(err, found_genre);
						});
				},
				function (found_genre, callback) {
					if (found_genre && found_genre._id.toString() !== genre._id.toString()) {
						callback(null, genre, true);
					} else {
						Genre.findByIdAndUpdate(req.params.id, genre, {}, callback);
					}
				}
			], function (err, genre, genreAlreadyExists) {
				if (err) return next(err);
				if (!genreAlreadyExists) { // Updated genre 
					// Successful - redirect to genre detail page.
					res.redirect(genre.url);
				} else { // Genre already exists
					var errors = [{msg: 'Genre already exists'}];
					res.render('genre_form', {title: 'Update Genre', genre: genre, errors: errors});
				}
			})
		}
	}
];
