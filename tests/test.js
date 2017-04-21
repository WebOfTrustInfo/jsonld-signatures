/**
 * Test runner for JSON-LD Signatures library.
 *
 * @author Dave Longley <dlongley@digitalbazaar.com>
 * @author Manu Sporny <msporny@digitalbazaar.com>
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */
(function() {

'use strict';

// detect node.js (vs. phantomJS)
var _nodejs = (typeof process !== 'undefined' &&
  process.versions && process.versions.node);

var _jsdir, jsonld, jsigs, assert, program;

if(_nodejs) {
  _jsdir = process.env.JSDIR || 'lib';
  jsonld = require('../node_modules/jsonld');
  jsigs = require('../' + _jsdir + '/jsonld-signatures')();
  assert = require('assert');
  program = require('commander');
  program
    .option('--bail', 'Bail when a test fails')
    .parse(process.argv);
} else {
  var system = require('system');
  require('./bind');
  require('./setImmediate');
  _jsdir = system.env.JSDIR || 'lib';
  window.async = require('async');
  var forge = require('../node_modules/node-forge');
  window.forge = forge;
  var bitcoreMessage = require('../node_modules/bitcore-message/dist/bitcore-message.js');
  window.bitcoreMessage = bitcoreMessage;
  require('../node_modules/jsonld');
  jsonld = jsonldjs;
  require('../' + _jsdir + '/jsonld-signatures');
  jsigs = window.jsigs;
  window.Promise = require('es6-promise').Promise;
  assert = require('chai').assert;
  require('mocha/mocha');
  require('mocha-phantomjs/lib/mocha-phantomjs/core_extensions');

  // PhantomJS is really bad at doing XHRs, so we have to fake the network
  // fetch of the JSON-LD Contexts
  var contextLoader = function(url, callback) {
    if(url === 'https://w3id.org/security/v1') {
      callback(null, {
        contextUrl: null,
        document: securityContext,
        documentUrl: 'https://web-payments.org/contexts/security-v1.jsonld'
      });
    }
  };
  jsonld.documentLoader = contextLoader;

  program = {};
  for(var i = 0; i < system.args.length; ++i) {
    var arg = system.args[i];
    if(arg.indexOf('--') === 0) {
      var argname = arg.substr(2);
      switch(argname) {
      default:
        program[argname] = true;
      }
    }
  }

  mocha.setup({
    reporter: 'spec',
    ui: 'bdd'
  });
}

// helper:
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// run tests
describe('JSON-LD Signatures', function() {
  var testPublicKeyUrl = 'https://example.com/i/alice/keys/1';
  var testPublicKeyPem =
    '-----BEGIN PUBLIC KEY-----\r\n' +
    'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4R1AmYYyE47FMZgo708NhFU+t\r\n' +
    '+VWn133PYGt/WYmD5BnKj679YiUmyrC3hX6oZfo4eVpOkycxZvGgXCLQGuDp45Xf\r\n' +
    'Zkdsjqs3o62En4YjlHWxgeGmkiRqGfZ3sJ3u5WZ2xwapdZY3/2T/oOV5ri8SktTv\r\n' +
    'mVGCyhwFuJC/NbJMEwIDAQAB\r\n' +
    '-----END PUBLIC KEY-----';
  var testPrivateKeyPem = '-----BEGIN RSA PRIVATE KEY-----\r\n' +
    'MIICWwIBAAKBgQC4R1AmYYyE47FMZgo708NhFU+t+VWn133PYGt/WYmD5BnKj679\r\n' +
    'YiUmyrC3hX6oZfo4eVpOkycxZvGgXCLQGuDp45XfZkdsjqs3o62En4YjlHWxgeGm\r\n' +
    'kiRqGfZ3sJ3u5WZ2xwapdZY3/2T/oOV5ri8SktTvmVGCyhwFuJC/NbJMEwIDAQAB\r\n' +
    'AoGAZXNdPMQXiFGSGm1S1P0QYzJIW48ZCP4p1TFP/RxeCK5bRJk1zWlq6qBMCb0E\r\n' +
    'rdD2oICupvN8cEYsYAxZXhhuGWZ60vggbqTTa+4LXB+SGCbKMX711ZoQHdY7rnaF\r\n' +
    'b/Udf4wTLD1yAslx1TrHkV56OfuJcEdWC7JWqyNXQoxedwECQQDZvcEmBT/Sol/S\r\n' +
    'AT5ZSsgXm6xCrEl4K26Vyw3M5UShRSlgk12gfqqSpdeP5Z7jdV/t5+vD89OJVfaa\r\n' +
    'Tw4h9BibAkEA2Khe03oYQzqP1V4YyV3QeC4yl5fCBr8HRyOMC4qHHKQqBp2VDUyu\r\n' +
    'RBJhTqqf1ErzUBkXseawNxtyuPmPrMSl6QJAQOgfu4W1EMT2a1OTkmqIWwE8yGMz\r\n' +
    'Q28u99gftQRjAO/s9az4K++WSUDGkU6RnpxOjEymKzNzy2ykpjsKq3RoIQJAA+XL\r\n' +
    'huxsYVE9Yy5FLeI1LORP3rBJOkvXeq0mCNMeKSK+6s2M7+dQP0NBYuPo6i3LAMbi\r\n' +
    'yT2IMAWbY76Bmi8TeQJAfdLJGwiDNIhTVYHxvDz79ANzgRAd1kPKPddJZ/w7Gfhm\r\n' +
    '8Mezti8HCizDxPb+H8HlJMSkfoHx1veWkdLaPWRFrA==\r\n' +
    '-----END RSA PRIVATE KEY-----';
  var testPublicKey = {
    '@context': jsigs.SECURITY_CONTEXT_URL,
    id: testPublicKeyUrl,
    type: 'CryptographicKey',
    owner: 'https://example.com/i/alice',
    publicKeyPem: testPublicKeyPem
  };
  var testPublicKeyOwner = {
    '@context': jsigs.SECURITY_CONTEXT_URL,
    id: 'https://example.com/i/alice',
    publicKey: [testPublicKey]
  };

  context('with NO security context', function() {
    // the test document that will be signed
    var testDocument = {
      '@context': ['https://w3id.org/security', {
        schema: 'http://schema.org/',
        name: 'schema:name',
        homepage: 'schema:url',
        image: 'schema:image'
      }],
      name: 'Manu Sporny',
      homepage: 'https://manu.sporny.org/',
      image: 'https://manu.sporny.org/images/manu.png'
    };
    var testDocumentSigned = {};

    describe('signing and verify Graph2012', function() {
      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'GraphSignature2012',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('should successfully sign a local document w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'GraphSignature2012',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }).then(function(signedDocument) {
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

      it('should successfully verify a local signed document w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

    });

    describe('signing and verify Graph2015', function() {
      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('should successfully sign a local document w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }).then(function(signedDocument) {
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

      it('should successfully verify a local signed document w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });
    });

    describe('signing and verify EcdsaKoblitzSignature2016', function() {

      var testDocument;
      var testDocumentSigned;
      var testPrivateKeyWif;
      var testPublicKeyWif;
      var testPublicKeyFriendly;
      var testPublicKeyBtc;
      var testPublicKeyBtcOwner;
      var invalidPublicKeyWif;
      var testDocumentSignedAltered;

      beforeEach(function() {
        testDocument = {
          '@context': {
            schema: 'http://schema.org/',
            name: 'schema:name',
            homepage: 'schema:url',
            image: 'schema:image'
          },
          name: 'Manu Sporny',
          homepage: 'https://manu.sporny.org/',
          image: 'https://manu.sporny.org/images/manu.png'
        };

        testDocumentSigned = clone(testDocument);
        testDocumentSigned["https://w3id.org/security#signature"] = {
          "@type": "EcdsaKoblitzSignature2016",
          "http://purl.org/dc/terms/created": {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2017-03-25T22:01:04Z"
          },
          "http://purl.org/dc/terms/creator": {
            "@id": "ecdsa-koblitz-pubkey:1LGpGhGK8whX23ZNdxrgtjKrek9rP4xWER"
          },
          "https://w3id.org/security#signatureValue": "IOoF0rMmpcdxNZFoirTpRMCyLr8kGHLqXFl7v+m3naetCx+OLNhVY/6SCUwDGZfFs4yPXeAl6Tj1WgtLIHOVZmw="
        };
        testDocumentSignedAltered = clone(testDocumentSigned);
        testDocumentSignedAltered.name = 'Manu Spornoneous';

        testPrivateKeyWif = 'L4mEi7eEdTNNFQEWaa7JhUKAbtHdVvByGAqvpJKC53mfiqunjBjw';
        testPublicKeyWif = '1LGpGhGK8whX23ZNdxrgtjKrek9rP4xWER';
        testPublicKeyFriendly = 'ecdsa-koblitz-pubkey:' + testPublicKeyWif;

        testPublicKeyBtc = {
          '@context': jsigs.SECURITY_CONTEXT_URL,
          id: testPublicKeyFriendly,
          type: 'CryptographicKey',
          owner: 'https://example.com/i/alice',
          publicKeyWif: testPublicKeyWif
        };

        testPublicKeyBtcOwner = {
          '@context': jsigs.SECURITY_CONTEXT_URL,
          id: 'https://example.com/i/alice',
          publicKey: [testPublicKeyFriendly]
        };

        invalidPublicKeyWif = '1BHdCBqQ1GQLfHVEnoXtYf44T97aEHodwe';
      });

      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'EcdsaKoblitzSignature2016',
          privateKeyWif: testPrivateKeyWif,
          creator: testPublicKeyFriendly
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyFriendly,
            'creator key for signature is wrong');
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('verify should return false if the document was signed by a different private key', function(done) {
        testPublicKeyBtc.publicKeyWif = invalidPublicKeyWif;

        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, false, 'signature verification should have failed');
          done();
        });
      });

      it('verify should return false if the document was altered after signing', function(done) {
        jsigs.verify(testDocumentSignedAltered, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, false, 'signature verification should have failed');
          done();
        });
      });

      it('should successfully sign a local document' +
        ' w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'EcdsaKoblitzSignature2016',
          privateKeyWif: testPrivateKeyWif,
          creator: testPublicKeyFriendly
        }).then(function(signedDocument) {
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyFriendly,
            'creator key for signature is wrong');
        }).then(done).catch(done);
      });

      it('should successfully verify a local signed document' +
        ' w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).then(done).catch(done);
      });

      it('verify should return false if the document was signed by' +
        ' a different private key w/promises API', function(done) {
        testPublicKeyBtc.publicKeyWif = invalidPublicKeyWif;

        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }).then(function(verified) {
          assert.equal(verified, false,
            'signature verification should have failed but did not');
        }).then(done).catch(done);
      });
    });

    describe('signing and verify RSA', function() {
      it('should successfully sign a local document', function(done) {

        testPrivateKeyPem = '-----BEGIN RSA PRIVATE KEY-----\r\n' +
        'MIIEogIBAAKCAQEAtpS1ZmfVKVP5KofIhMBP0tSWc4qlh6fm2lrZSkuKxUjEaWjz\r\n' +
        'ZSzs72gEIGxraWusMdoRuV54xsWRyf5KeZT0S+I5Prle3Idi3gICiO4NwvMk6JwS\r\n' +
        'BcJWwmSLFEKyUSnB2CtfiGc0/5rQCpcEt/Dn5iM+BNn7fqpoLIbks8rXKUIj8+qM\r\n' +
        'VqkTXsEKeKinE23t1ykMldsNaaOH+hvGti5Jt2DMnH1JjoXdDXfxvSP/0gjUYb0e\r\n' +
        'ktudYFXoA6wekmQyJeImvgx4Myz1I4iHtkY/Cp7J4Mn1ejZ6HNmyvoTE/4OuY1uC\r\n' +
        'eYv4UyXFc1s1uUyYtj4z57qsHGsS4dQ3A2MJswIDAQABAoIBACqdCrmcAmRi9QS4\r\n' +
        'LFTPjdHnTDYrZfcDeR39ljmA6CKjmTQBCs3SbnpyDISEyY0RVF9ORlS9d/Lsqdo7\r\n' +
        'P6ag3WPYqQO6wCk4cBrg3TaYWR3nIfYodwxhD17PmKZh6ryGwndxqBpt/DCsMWJH\r\n' +
        'XRKRZ46PKyp2tfwaSbYaxcYw0YcPQ8SQcnDnR9slk8qetmRDT753iuNB9mue1uEE\r\n' +
        'nE4H3nGag+fZtnxlGlml+blJiMWhJrRqCZ3fUROKMsCoYDe/0yu8F0ZagOFKET4h\r\n' +
        '9gAq3VPv3C0C/SXNLtBqmSSt9Sw2znjfeUILUgnO9pN1bc8twq1aaeUwAOu7NRo/\r\n' +
        'UpJ/ggECgYEA5BGU1c7af/5sFyfsa+onIJgo5BZu8uHvz3Uyb8OA0a+G9UPO1ShL\r\n' +
        'YjX0wUfhZcFB7fwPtgmmYAN6wKGVce9eMAbX4PliPk3r+BcpZuPKkuLk/wFvgWAQ\r\n' +
        '5Hqw2iEuwXLV0/e8c2gaUt/hyMC5+nFc4v0Bmv6NT6Pfry+UrK3BKWcCgYEAzPD+\r\n' +
        'B+nrngwF+O99BHvb47XGKR7ON8JCI6JxavzIkusMXCB8rMyYW8zLs68L8JLAzWZ3\r\n' +
        '4oMq0FPUnysBxc5nTF8Nb4BZxTZ5+9cHfoKrYTI3YWsmVW2FpCJFEjMs4NXZ28PB\r\n' +
        'kS9b4zjfS2KhNdkmCeOYU0tJpNfwmOTI90qeUdUCgYBomvPD+SNYr24OVN5oRLZ7\r\n' +
        'ia6/ptZuilh+s8dVYbs08agZ2GcGd3vT6OGAwSJNlI1TxVfDa7umsBHeRn6QCnUN\r\n' +
        '3CWp51g7MWw4lw8DRRmFs5HKsHLfSRuWX/u7oJqcWbpfhXInEKl6N3uMo3DpwJMU\r\n' +
        '/Wx+FaDk1UnkRROQ/ATrowKBgEsM9fpv75kxTf6btWyu7xe0uZzVay+ANDhYhLBp\r\n' +
        'YgpriVszinS9eA4mMXLb58Nx+qk9nSmWX1drW7HuTffiXnHZXVI37qgKCyHu3Q+3\r\n' +
        'SouNmDpUwvUF5qr04daIZybvKZkRVxGUBlJvwVYaCG9v1j5I2r+mEpILglB7eB0X\r\n' +
        'dmMBAoGABocuCOEOq+oyLDALwzMXU8gOf3IL1Q1/BWwsdoANoh6i179psxgE4JXT\r\n' +
        'oWcpXZQQqub8ngwE6uR9fpd3m6N/PL4T55vbDDyjPKmrL2ttC2gOtx9KrpPh+Z7L\r\n' +
        'QRo4BE48nHJJrystKHfFlaH2G7JxHNgMBYVADyttN09qEoav8Os=\r\n' +
          '-----END RSA PRIVATE KEY-----';

        var testDocumentJson = JSON.stringify(testDocument);
        jsigs.sign(testDocument, {
          algorithm: 'RsaSignature2017',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }, function(err, signedDocument) {
          console.log(signedDocument);
          assert.ifError(err);
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('should successfully sign a local document w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'RsaSignature2017',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }).then(function(signedDocument) {
          assert.notEqual(
            signedDocument['https://w3id.org/security#signature'], undefined,
            'signature was not created');
          assert.equal(
            signedDocument['https://w3id.org/security#signature']
              ['http://purl.org/dc/terms/creator']['@id'], testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

      it('should successfully verify a local signed document w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });
    });
  });



  context('with security context', function() {
    // the test document that will be signed
    var testDocument = {
      '@context': [{
        schema: 'http://schema.org/',
        name: 'schema:name',
        homepage: 'schema:url',
        image: 'schema:image'
      }, jsigs.SECURITY_CONTEXT_URL],
      name: 'Manu Sporny',
      homepage: 'https://manu.sporny.org/',
      image: 'https://manu.sporny.org/images/manu.png'
    };
    var testDocumentSigned = {};

    describe('signing and verify GraphSignature2012 w/security context', function() {
      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'GraphSignature2012',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(signedDocument.signature, undefined,
            'signature was not created');
          assert.equal(signedDocument.signature.creator, testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('should successfully sign a local document w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'GraphSignature2012',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }).then(function(signedDocument) {
          assert.notEqual(signedDocument.signature, undefined,
            'signature was not created');
          assert.equal(signedDocument.signature.creator, testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

      it('should successfully verify a local signed document w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

    });

    describe('signing and verify LinkedDataSignature2015 w/security context', function() {
      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(signedDocument.signature, undefined,
            'signature was not created');
          assert.equal(signedDocument.signature.creator, testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('should successfully sign a local document w/promises', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'LinkedDataSignature2015',
          privateKeyPem: testPrivateKeyPem,
          creator: testPublicKeyUrl
        }).then(function(signedDocument) {
          assert.notEqual(signedDocument.signature, undefined,
            'signature was not created');
          assert.equal(signedDocument.signature.creator, testPublicKeyUrl,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });

      it('should successfully verify a local signed document w/promises', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKey,
          publicKeyOwner: testPublicKeyOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).catch(function(err) {
          assert.ifError(err);
        }).then(function() {
          done();
        });
      });
    });

    describe('signing and verify EcdsaKoblitzSignature2016', function() {
      var testDocument;
      var testDocumentSigned;
      var testPrivateKeyWif;
      var testPublicKeyWif;
      var testPublicKeyFriendly;
      var testPublicKeyBtc;
      var testPublicKeyBtcOwner;
      var invalidPublicKeyWif;
      var testDocumentSignedAltered;

      beforeEach(function() {
        testDocument = {
          '@context': [{
            schema: 'http://schema.org/',
            name: 'schema:name',
            homepage: 'schema:url',
            image: 'schema:image'
          }, jsigs.SECURITY_CONTEXT_URL],
          name: 'Manu Sporny',
          homepage: 'https://manu.sporny.org/',
          image: 'https://manu.sporny.org/images/manu.png'
        };

        testDocumentSigned = clone(testDocument);
        testDocumentSigned["https://w3id.org/security#signature"] = {
          "@type": "EcdsaKoblitzSignature2016",
          "http://purl.org/dc/terms/created": {
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
            "@value": "2017-03-25T22:01:04Z"
          },
          "http://purl.org/dc/terms/creator": {
            "@id": "ecdsa-koblitz-pubkey:1LGpGhGK8whX23ZNdxrgtjKrek9rP4xWER"
          },
          "https://w3id.org/security#signatureValue": "IOoF0rMmpcdxNZFoirTpRMCyLr8kGHLqXFl7v+m3naetCx+OLNhVY/6SCUwDGZfFs4yPXeAl6Tj1WgtLIHOVZmw="
        };
        testDocumentSignedAltered = clone(testDocumentSigned);
        testDocumentSignedAltered.name = 'Manu Spornoneous';

        testPrivateKeyWif = 'L4mEi7eEdTNNFQEWaa7JhUKAbtHdVvByGAqvpJKC53mfiqunjBjw';
        testPublicKeyWif = '1LGpGhGK8whX23ZNdxrgtjKrek9rP4xWER';
        testPublicKeyFriendly = 'ecdsa-koblitz-pubkey:' + testPublicKeyWif;

        testPublicKeyBtc = {
          '@context': jsigs.SECURITY_CONTEXT_URL,
          id: testPublicKeyFriendly,
          type: 'CryptographicKey',
          owner: 'https://example.com/i/alice',
          publicKeyWif: testPublicKeyWif
        };

        testPublicKeyBtcOwner = {
          '@context': jsigs.SECURITY_CONTEXT_URL,
          id: 'https://example.com/i/alice',
          publicKey: [testPublicKeyFriendly]
        };

        invalidPublicKeyWif = '1BHdCBqQ1GQLfHVEnoXtYf44T97aEHodwe';
      });

      it('should successfully sign a local document', function(done) {
        jsigs.sign(testDocument, {
          algorithm: 'EcdsaKoblitzSignature2016',
          privateKeyWif: testPrivateKeyWif,
          creator: testPublicKeyFriendly
        }, function(err, signedDocument) {
          assert.ifError(err);
          assert.notEqual(
            signedDocument.signature, undefined, 'signature was not created');
          assert.equal(
            signedDocument.signature.creator, testPublicKeyFriendly,
            'creator key for signature is wrong');
          done();
        });
      });

      it('should successfully verify a local signed document', function(done) {
        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, true, 'signature verification failed');
          done();
        });
      });

      it('verify should return false if the document was signed by a different private key', function(done) {
        testPublicKeyBtc.publicKeyWif = invalidPublicKeyWif;

        jsigs.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }, function(err, verified) {
          assert.ifError(err);
          assert.equal(verified, false, 'signature verification should have failed');
          done();
        });
      });

      it('should successfully sign a local document' +
        ' w/promises API', function(done) {
        jsigs.promises.sign(testDocument, {
          algorithm: 'EcdsaKoblitzSignature2016',
          privateKeyWif: testPrivateKeyWif,
          creator: testPublicKeyFriendly
        }).then(function(signedDocument) {
          assert.notEqual(signedDocument.signature, undefined,
            'signature was not created');
          assert.equal(signedDocument.signature.creator, testPublicKeyFriendly,
            'creator key for signature is wrong');
          testDocumentSigned = signedDocument;
        }).then(done).catch(done);
      });

      it('should successfully verify a local signed document' +
        ' w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }).then(function(verified) {
          assert.equal(verified, true, 'signature verification failed');
        }).then(done).catch(done);
      });

      it('verify should return false if the document was signed by' +
        ' a different private key w/promises API', function(done) {
        testPublicKeyBtc.publicKeyWif = invalidPublicKeyWif;

        jsigs.promises.verify(testDocumentSigned, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }).then(function(verified) {
          assert.equal(verified, false,
            'signature verification should have failed but did not');
        }).then(done).catch(done);
      });

      it('verify should return false if the document was altered after' +
        ' signing w/promises API', function(done) {
        jsigs.promises.verify(testDocumentSignedAltered, {
          publicKey: testPublicKeyBtc,
          publicKeyOwner: testPublicKeyBtcOwner
        }).then(function(verified) {
          assert.equal(verified, false,
            'signature verification should have failed but did not');
        }).then(done).catch(done);
      });

    });

  });
});

if(!_nodejs) {
  mocha.run(function() {
    phantom.exit();
  });
}

// the security context that is used when loading https://w3id.org/security/v1
var securityContext = {
  "@context": {
    "id": "@id",
    "type": "@type",

    "dc": "http://purl.org/dc/terms/",
    "sec": "https://w3id.org/security#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",

    "EcdsaKoblitzSignature2016": "sec:EcdsaKoblitzSignature2016",
    "EncryptedMessage": "sec:EncryptedMessage",
    "GraphSignature2012": "sec:GraphSignature2012",
    "LinkedDataSignature2015": "sec:LinkedDataSignature2015",
    "LinkedDataSignature2016": "sec:LinkedDataSignature2016",
    "CryptographicKey": "sec:Key",

    "authenticationTag": "sec:authenticationTag",
    "canonicalizationAlgorithm": "sec:canonicalizationAlgorithm",
    "cipherAlgorithm": "sec:cipherAlgorithm",
    "cipherData": "sec:cipherData",
    "cipherKey": "sec:cipherKey",
    "created": {"@id": "dc:created", "@type": "xsd:dateTime"},
    "creator": {"@id": "dc:creator", "@type": "@id"},
    "digestAlgorithm": "sec:digestAlgorithm",
    "digestValue": "sec:digestValue",
    "domain": "sec:domain",
    "encryptionKey": "sec:encryptionKey",
    "expiration": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
    "expires": {"@id": "sec:expiration", "@type": "xsd:dateTime"},
    "initializationVector": "sec:initializationVector",
    "iterationCount": "sec:iterationCount",
    "nonce": "sec:nonce",
    "normalizationAlgorithm": "sec:normalizationAlgorithm",
    "owner": {"@id": "sec:owner", "@type": "@id"},
    "password": "sec:password",
    "privateKey": {"@id": "sec:privateKey", "@type": "@id"},
    "privateKeyPem": "sec:privateKeyPem",
    "publicKey": {"@id": "sec:publicKey", "@type": "@id"},
    "publicKeyPem": "sec:publicKeyPem",
    "publicKeyService": {"@id": "sec:publicKeyService", "@type": "@id"},
    "revoked": {"@id": "sec:revoked", "@type": "xsd:dateTime"},
    "salt": "sec:salt",
    "signature": "sec:signature",
    "signatureAlgorithm": "sec:signingAlgorithm",
    "signatureValue": "sec:signatureValue"
  }
};

})();
