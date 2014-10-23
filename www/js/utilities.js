
  try { console.log('init console... done'); } catch(e) { console = { log: function() {} } }
      
  hls.util = {
    accessToken:function(){
      if(hls.user.loggedIn()){
        return {single_access_token:hls.user.get('single_access_token')};
      } else {
        return {};
      }
    },
    addAccessToken:function(data){
      return _.extend(data,this.accessToken());
    },
    shouldSplitView : function(event){
      if(event && event.orientation){
        if(event.orientation == 'portrait'){
          console.log('popover');
          return false;
        }
        else if(event.orientation == 'landscape') {
          console.log('splitview');
          return true;
        }
      }
      else if($(window).width() > 768){
        console.log('splitview');
        return true;
      }
      console.log('popover');
      return false; 
    },
    _fail:function(error){
       //fail silently
       //this might happen on fresh install
    },
    _gotFileWriteEntry:function(fileEntry){
      fileEntry.createWriter(hls.util._gotFileWriter, hls.util._fail);

    },
    _gotFileReadEntry:function(fileEntry){
      fileEntry.file(hls.util._gotFileRead, hls.util._fail);

    },
    _gotFileRemoveEntry:function(fileEntry){
      fileEntry.remove(hls.util._gotFileRemoved, hls.util._fail);
    },
    _gotFileWriter:function(writer) {
           writer.onwrite = function(evt) {
          };
          //setup the JSON to look exactly like the API
          var attributes = {user:hls.user.attributes};
          //rewrite the car attribute to make sure it's the latest
          attributes.user.cars = _.map(hls.user.cars.models, function(car){ return car.attributes; });
          writer.write(JSON.stringify(attributes));
    },
    _gotFileRead:function(file){
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            //alert('data read');
            data = JSON.parse(evt.target.result);
            hls.user.set(data.user);
            hls.user.cars.set(data.user.cars, {remove:false});
            //reload the homepage using changePage instead of app.navigate since we are already on the homepage
            app.changePage(new hls.WelcomeView());
        };
        reader.readAsText(file);
    },
    _gotFileRemoved:function(entry){
      alert('Logged Out.');
      //reload the homepage using changePage instead of app.navigate since we might already be on the homepage
      app.changePage(new hls.WelcomeView());
    }

  //   unwrap:function(array, str){ 
  //     //for removing objectname from JSON result
  //     return _.map(array, function(obj){return obj[str]; });
  //   },

  //   random:function(){
  //     return Math.ceil(Math.random()*100000000);
  //   },
  //   wrapError : function(onError, model, options) { //for fetch rewrite
  //       return function(resp) {
  //         if (onError) {
  //           onError(model, resp, options);
  //         } else {
  //           model.trigger('error', model, resp, options);
  //         }
  //       };
  //   },
  //   getUrl : function(object) { //for sync rewrite
  //     if (!(object && object.url)) return null;
  //     return _.isFunction(object.url) ? object.url() : object.url;
  //   },
  //   urlError : function() { //for sync rewrite
  //     throw new Error('A "url" property or function must be specified');
  //   },
  //   //tracking for Google analytics
  //   //e.g. ss.util.track("Campaign","click","myCampaign")
  //   track:function(category,action,label,value,count){
  //    // if(window._gaq){
  //       try {
  //         //console.log("tracking:",category+","+action+","+label+","+value)
  //         _gaq.push(['_trackEvent',"(MEG) "+category,action,label,value,count])
  //       } catch(e) {
         
  //       }
  //    // }
  //   },
  //   snippet:function(line,chars){
  //     chars || (chars = 20);
  //     line = line+""; //convert to string
  //     if (line.length > chars){
  //       parts = line.slice(0,chars).split(" ");
  //       if (parts.length == 1){
  //         return line.slice(0,chars)+"..."
  //       }
  //       parts.pop(); //remove word fragment
  //       line = parts.join(" ")+"..."
  //     }
  //     return line;
  //   },
  //   gup:function ( name ){ //gup = Get URL Parameters e.g. search query
  //     name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  //     var regexS = "[\\?&]"+name+"=([^&#]*)";
  //     var regex = new RegExp( regexS );
  //     var results = regex.exec( window.location.href );
  //     if( results == null )
  //       return "";
  //     else
  //       return results[1];
  //   },
   } //end Utilities

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
    c = isNaN(c = Math.abs(c)) ? 2 : c, 
    d = d == undefined ? "." : d, 
    t = t == undefined ? "," : t, 
    s = n < 0 ? "-" : "", 
    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
    j = (j = i.length) > 3 ? j % 3 : 0;
   return "$"+s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

 Number.prototype.formatCents = function(){
  return (this/100).formatMoney();
 }

  