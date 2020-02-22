var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances
exports.bookinstance_list = function (req, res, next) {
	// Daisy-chain a call to populate()
	BookInstance.find()
		.populate('book')
		.exec(function (err, list_bookinstances) {
			if (err) return next(err);
			// Successful, so render
			res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
		});
};

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function (req, res, next) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, bookinstance) {
			if (err) return next(err);
			if (bookinstance == null) {
				var err = new Error('Book copy not found');
				err.status = 404;
				return next(err);
			}
			res.render('bookinstance_detail', {title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance });
		});
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
	Book.find({}, 'title')
		.exec(function (err, books) {
			if (err) return next(err);
			res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books });
		});
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
	// Validate fields
	body('book', 'Book must be specified').trim().isLength({min: 1}),
	body('imprint', 'Imprint must be specified').trim().isLength({min: 1}),
	body('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601(),

	// Sanitize fields
	sanitizeBody('book').escape(),
	sanitizeBody('imprint').escape(),
	sanitizeBody('status').trim().escape(),
	sanitizeBody('due_back').toDate(),

	// Process request after validation and sanitization
	(req, res, next) => {
		const errors = validationResult(req);

		var bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			status: req.body.status,
			due_back: req.body.due_back
		});

		if (!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) return next(err);
					// Successful, so render.
					res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book_id, errors: errors.array(), bookinstance: bookinstance});
				});
			return;
		} else {
			// Data from form is valid.
			bookinstance.save(function (err) {
				if (err) return next(err);
				// Successful - redirect to new record.
				res.redirect(bookinstance.url);
			})
		}
	}
];

// Display BookInstane delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, bookinstance) {
			if (err) return next(err);
			if (bookinstance === null) {
				res.redirect('/catalog/bookinstances')
			}
			res.render('bookinstance_delete', {title: 'Delete Book Instance', bookinstance: bookinstance})
		});
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function (req, res, next) {
	BookInstance.findByIdAndRemove(req.body.bookinstanceid)
		.exec(function (err) {
			if (err) return next(err);
			res.redirect('/catalog/bookinstances');
		})
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function (req, res, next) {
	async.parallel({
		bookinstance: function (callback) {
			BookInstance.findById(req.params.id)
				.exec(callback);
		},
		books: function (callback) {
			Book.find({}, 'title')
				.exec(callback);
		}
	}, function (err, results) {
		if (err) return next(err);
		if (results.bookinstance === null) { // No results
			var err = new Err('Book Instance not found');
			err.status = 404;
			return next(err);
		}
		res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: results.bookinstance, selected_book: results.bookinstance.book_id, book_list: results.books});
	});
};

// Handle BookInstance update on POST
exports.bookinstance_update_post = [
	// Validate fields
	body('book', 'Book must be specified').trim().isLength({min: 1}),
	body('imprint', 'Imprint must be specified').trim().isLength({min: 1}),
	body('due_back', 'Invalid date').optional({ checkFalsy: true}).isISO8601(),

	// Sanitize fields
	sanitizeBody('book').escape(),
	sanitizeBody('imprint').escape(),
	sanitizeBody('status').trim().escape(),
	sanitizeBody('due_back').toDate(),

	(req, res, next) => {
		const errors = validationResult(req);
		var bookinstance = new BookInstance({
			book: req.body.book,
			imprint: req.body.imprint,
			due_back: req.body.due_back,
			status: req.body.status,
			_id: req.params.id
		});
		if (!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) return next(err);
					// Successful, so render.
					res.render('bookinstance_form', {title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book_id, errors: errors.array(), bookinstance: bookinstance});
				});
			return;
		} else {
			// Data from form is valid.
			BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
				if (err) return next(err);
				// Successful - redirect to new record.
				res.redirect(thebookinstance.url);
			});
		}
	}
];