'use strict';
function fetchExtensions() {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
              const response = JSON.parse(xmlhttp.response)
              response.extensions.forEach((extension) => {
                document.getElementById("extensions").innerHTML += extension
              })
           } else {
              console.log('Request returned ' + xmlhttp.status)
           }
        }
    }

    xmlhttp.open('GET', '/brave-extension-store', true)
    xmlhttp.send()
}
/*function checkForUpdates () {
    //.
    xmlhttp.open('GET', '/brave-extension-store-update', true)
}
*/
fetchExtensions()
