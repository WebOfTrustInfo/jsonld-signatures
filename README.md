jsonld-signatures with 2017 RSA Signature Suite support
=======================================================

Built during [Rebooting Web-of-Trust](http://www.weboftrust.info/) in Paris on April 21st 2017.

![RWoT Logo](https://github.com/WebOfTrustInfo/ld-signatures-java/blob/master/wot-logo.png?raw=true)

### Example

This sample uses same keys as used in `test.js`

JSON-LD input:

```javascript

var testDocument = {
  '@context': [{
    schema: 'http://schema.org/',
    name: 'schema:name',
    homepage: 'schema:url',
    image: 'schema:image'
  }, 'https://w3id.org/security/v1'],
  name: 'Manu Sporny',
  homepage: 'https://manu.sporny.org/',
  image: 'https://manu.sporny.org/images/manu.png'
};

```
Example code:

```javascript

jsig.sign(testDocument, {
  privateKeyPem: testPrivateKeyPem,
  creator: 'https://example.com/i/alice/keys/1',
  algorithm: 'RsaSignature2017',
  date: '2017-04-24T05:33:31Z'
}, function(err, signedDocument) {
  if(err) {
    return console.log('Signing error:', err);
  }
  console.log('Signed document:', signedDocument);

  // verify the signed document
  jsig.verify(signedDocument, {
    publicKey: testPublicKey,
    publicKeyOwner: testPublicKeyOwner,
  }, function(err, verified) {
    if(err) {
      return console.log('Signature verification error:', err);
    }
    console.log('Signature is valid:', verified);
  });
});


```

Output JSON-LD with signature:

```json
{
  "@context": [
    {
      "schema": "http://schema.org/",
      "name": "schema:name",
      "homepage": "schema:url",
      "image": "schema:image"
    },
    "https://w3id.org/security/v1"
  ],
  "name": "Manu Sporny",
  "homepage": "https://manu.sporny.org/",
  "image": "https://manu.sporny.org/images/manu.png",
  "signature": {
    "type": "RsaSignature2017",
    "created": "2017-04-24T05:33:31Z",
    "creator": "https://example.com/i/alice/keys/1",
    "signatureValue": "eyJhbGciOiJSUzI1NiIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..PQKyNmxurmzfbFoAw9TbFoQTx1uQ3sfTzgJHxQmb6C6A+GBXVyLK8yCNMjf47ECrsGbK7Iy1pfOgEIWP8XCTRSaVumTim4E/hxytTpExMuX/BOcup24qddbBPR+cPTH0E1NpDOdHDF76mLuC5yxKYWqrBVwnCgimXcc2gGJCUVs="
  }
}

```  


### Information

See [jsonld-signatures](https://github.com/digitalbazaar/jsonld-signatures) repo for the official version and documentation. This forked repo is a work-in-progress implementation of the [2017 RSA Signature Suite](https://w3c-dvcg.github.io/lds-rsa2017/) for the Linked Data Signatures specification.

See the [signature alignment abstract](https://github.com/WebOfTrustInfo/rebooting-the-web-of-trust-spring2017/blob/master/event-documents/group-abstracts/SignatureAlignmentAbstract.md).

Highly experimental, incomplete, and not ready for production use! Use at your own risk! Pull requests welcome.

### Test case

See `signing and verify RSA`

### About

Rebooting Web-of-Trust - http://www.weboftrust.info/

Kim Hamilton Duffy
Learning Machine - http://www.learningmachine.com/
Blockcerts - http://www.blockcerts.org/
