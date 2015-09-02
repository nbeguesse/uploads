
  try { console.log('init console... done'); } catch(e) { console = { log: function() {} } }
      
  hls.util = {
    accessToken:function(){
      if(hls.user.loggedIn()){
        return {single_access_token:hls.user.get('single_access_token'),v:hls.api_version};
      } else {
        return {v:hls.api_version};
      }
    },
    addAccessToken:function(data){
      return this.addParam(data,this.accessToken());
    },
    addParam:function(data, param){
      if(typeof data == "string"){
        return data+"&"+jQuery.param(param);
      } else {
        return _.extend(data,param);
      }
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

    gup:function ( name , url){ //gup = Get URL Parameters e.g. search query
      url = url || window.location.href
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( url );
      if( results == null )
        return "";
      else
        return results[1];
    },
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
 Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
  };
  