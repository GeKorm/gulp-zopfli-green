REPORTER = spec
test:
	@NODE_ENV=test ./node_modules/.bin/mocha -b --reporter $(REPORTER)

lint:
	./node_modules/.bin/jshint ./lib ./index.js

test-cov:
	$(MAKE) test REPORTER=spec
	$(MAKE) test REPORTER=doc 1> coverage.html

test-coveralls:
	./node_modules/.bin/nyc cover ./node_modules/.bin/_mocha -- -R spec && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js
	rm -rf lib-cov

clean:
	rm -rf ./lib/binding
	rm -rf ./coverage

.PHONY: test
