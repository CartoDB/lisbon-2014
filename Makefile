
UGLIFYJS = node ./node_modules/uglify-js/bin/uglifyjs -o
JS_FILES = $(wildcard js/*.js)

minify:
	cat $(JS_FILES) > js/_app.js
	$(UGLIFYJS) js/_app.js > js/app.js
