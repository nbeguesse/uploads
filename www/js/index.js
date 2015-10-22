          window.hls = {};
          hls.server = "http://monroneylabels.com"; //no trailing slash. 
          hls.httpsserver = "https://monroneylabels.com"; //no trailing slash. 
          //Note that you can't google-print from local server.
          //Note that you can't do CORS requests from local server.
          //All requests are JSONP anyway
          hls.api_version = 2;
          
          hls.use_in_app_purchases = true; //set this to false to make every car free
          hls.emulated = false; 
          if (typeof(cordova) == "undefined" || (window.parent && window.parent.ripple)){
            //set hls.emulated to true to skip VIN scanning
            hls.emulated = true;
           // hls.server = "http://localhost:3000"; //no trailing slash. 
           // hls.httpsserver = "http://localhost:3000"; //no trailing slash.
          }
          window.ga = null;

<!-- Google Analytics -->
        (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
        })(window,document,'script','js/vendor/analytics.js','ga');