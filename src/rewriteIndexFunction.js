/**
 * Rewrite requests to append index.html to directory requests
 * 
 * Code from https://github.com/aws-samples/amazon-cloudfront-functions/blob/main/url-rewrite-single-page-apps/index.js
 * @param  event 
 * @returns request
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  
  // Check whether the URI is missing a file name.
  if (uri.endsWith('/')) {
      request.uri += 'index.html';
  } 
  // Check whether the URI is missing a file extension.
  else if (!uri.includes('.')) {
      request.uri += '/index.html';
  }

  return request;
}