// This a testrpc wrapper for running tests in karma. Tests require a testrpc http
// server to  be running in the background. This scripts starts a testrpc server,
// once started runs karma, closes the testrpc server once testing is complete,
// lastly returns the same exit code as the test child process. Consumes same
// arguments as karma.

const TestRPC = require('ethereumjs-testrpc')
const TestRPCserver = TestRPC.server()
const spawn = require('child_process').spawn

const karmaArgs = process.argv.splice(2)

TestRPCserver.listen({port: 8545}, function (err, blockchain) {
	// Karma has a public API which can be used, but lacks documentation. For the
	// time being, process.spawn was a simpler approach.
  const karma = spawn('./node_modules/.bin/karma', karmaArgs)

  karma.stdout.on('data', (data) => {
    process.stdout.write(`${data}`)
  })

  karma.stderr.on('data', (data) => {
    process.stdout.write(`${data}`)
  })

  karma.on('close', (code) => {
    TestRPCserver.close()
    process.exit(`${code}`)
  })
})
