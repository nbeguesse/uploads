
  try { console.log('init console... done'); } catch(e) { console = { log: function() {} } }
      
  hls.util = {
    unwrap:function(array, str){ 
      //for removing objectname from JSON result
      return _.map(array, function(obj){return obj[str]; });
    },

    random:function(){
      return Math.ceil(Math.random()*100000000);
    },
    wrapError : function(onError, model, options) { //for fetch rewrite
        return function(resp) {
          if (onError) {
            onError(model, resp, options);
          } else {
            model.trigger('error', model, resp, options);
          }
        };
    },
    getUrl : function(object) { //for sync rewrite
      if (!(object && object.url)) return null;
      return _.isFunction(object.url) ? object.url() : object.url;
    },
    urlError : function() { //for sync rewrite
      throw new Error('A "url" property or function must be specified');
    },
    //tracking for Google analytics
    //e.g. ss.util.track("Campaign","click","myCampaign")
    track:function(category,action,label,value,count){
     // if(window._gaq){
        try {
          //console.log("tracking:",category+","+action+","+label+","+value)
          _gaq.push(['_trackEvent',"(MEG) "+category,action,label,value,count])
        } catch(e) {
         
        }
     // }
    },
    snippet:function(line,chars){
      chars || (chars = 20);
      line = line+""; //convert to string
      if (line.length > chars){
        parts = line.slice(0,chars).split(" ");
        if (parts.length == 1){
          return line.slice(0,chars)+"..."
        }
        parts.pop(); //remove word fragment
        line = parts.join(" ")+"..."
      }
      return line;
    },
    gup:function ( name ){ //gup = Get URL Parameters e.g. search query
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( window.location.href );
      if( results == null )
        return "";
      else
        return results[1];
    },
  } //end Utilities

  