var mongoose = require('mongoose');
var moment = require('moment');

// Schema constructor
var Schema = mongoose.Schema;

// Create Author schema object
var AuthorSchema = new Schema({
	first_name: {type: String, required: true, max: 100},
	family_name: {type: String, required: true, max: 100},
	date_of_birth: {type: Date},
	date_of_death: {type: Date}
});

// Create virtual property/field for author's full name
AuthorSchema.
	virtual('name').
	get(function() { // add custom getter for this virtual
		// `this` refers to document/model instance

		// To avoid errors in cases where an author does not have either a family name or first name
		// We want to make sure we handle the exception by returning an empty string for that case
		var fullname = '';
		if (this.first_name && this.family_name) {
			fullname = this.family_name + ', ' + this.first_name;
		}
		if (!this.first_name || !this.family_name) { // redundant
			fullname = '';
		}
		return fullname;
	});

// Create virtual property/field for author's lifespan
AuthorSchema.
	virtual('lifespan').
	get(function () {
		return (this.date_of_birth ? moment(this.date_of_birth).format('MMM Do, YYYY') : '') + ' - ' + (this.date_of_death ? moment(this.date_of_death).format('MMM Do, YYYY') : '')
		//return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
	});

// Create virtual property/field for author's URL
AuthorSchema.
	virtual('url').
	get(function () {
		return '/catalog/author/' + this._id;
	});

AuthorSchema
	.virtual('date_of_birth_formatted')
	.get(function() {
		return this.date_of_birth ? moment(this.date_of_birth).format('YYYY-MM-DD') : '';
	});

AuthorSchema
	.virtual('date_of_death_formatted')
	.get(function() {
		return this.date_of_death ? moment(this.date_of_death).format('YYYY-MM-DD') : '';
	});

// Compile model from schema and export model
module.exports = mongoose.model('Author', AuthorSchema);








