/* Combined sources:

- Coursera course: Creative Programming for Digital Media & Mobile Apps
- https://gist.github.com/andyburke/1498758 (the postImageToFacebook function)
- https://coderwall.com/p/4qpmfw

*/

// Source: https://gist.github.com/andyburke/1498758

// This bit is important.  It detects/adds XMLHttpRequest.sendAsBinary.  Without this
// you cannot send image data as part of a multipart/form-data encoded request from
// Javascript.  This implementation depends on Uint8Array, so if the browser doesn't
// support either XMLHttpRequest.sendAsBinary or Uint8Array, then you will need to
// find yet another way to implement this.

// from: http://stackoverflow.com/a/5303242/945521

if ( XMLHttpRequest.prototype.sendAsBinary === undefined ) {
    XMLHttpRequest.prototype.sendAsBinary = function(string) {
        var bytes = Array.prototype.map.call(string, function(c) {
            return c.charCodeAt(0) & 0xff;
        });
        this.send(new Uint8Array(bytes).buffer);
    };
}

// This function takes an array of bytes that are the actual contents of the image file.
// In other words, if you were to look at the contents of imageData as characters, they'd
// look like the contents of a PNG or GIF or what have you.  For instance, you might use
// pnglib.js to generate a PNG and then upload it to Facebook, all from the client.
//
// Arguments:
//   authToken - the user's auth token, usually from something like authResponse.accessToken
//   filename - the filename you'd like the uploaded file to have
//   mimeType - the mime type of the file, eg: image/png
//   imageData - an array of bytes containing the image file contents
//   message - an optional message you'd like associated with the image

function postImageToFacebook( authToken, filename, mimeType, imageData, message )
{
    var boundary = '----BeardSimulatorBoundary2014';
    
    var formData = '--' + boundary + '\r\n'
    formData += 'Content-Disposition: form-data; name="source"; filename="' + filename + '"\r\n';
    formData += 'Content-Type: ' + mimeType + '\r\n\r\n';
    for ( var i = 0; i < imageData.length; ++i )
    {
        formData += String.fromCharCode( imageData[ i ] & 0xff );
    }
    formData += '\r\n';
    formData += '--' + boundary + '\r\n';
    formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
    formData += message + '\r\n'
    formData += '--' + boundary + '--\r\n';
    
    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken, true );
    xhr.onload = xhr.onerror = function() {
    };
    xhr.setRequestHeader( "Content-Type", "multipart/form-data; boundary=" + boundary );
    xhr.sendAsBinary( formData );
}

function postCanvasToFacebook(data, message, callback) {
	var encodedPng = data.substring(data.indexOf(',') + 1, data.length);
	var decodedPng = Base64Binary.decode(encodedPng);
	var fileName = "generated_image";
	
	FB.login(function(response) {// do the following once login happens
		if (response.authResponse) {// check what happened
			postImageToFacebook(FB.getAuthResponse()['accessToken'], fileName, "image/png", decodedPng, message);
			if (callback) { callback(); }
		}
		else {
			 alert("Error during Facebook login");
		}
	  },{scope: "publish_stream"});
};