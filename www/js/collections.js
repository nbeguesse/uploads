  hls.Collection = Backbone.Collection.extend({
    //PUBLIC FUNCTIONS
    //a modification of fetch
    //this is the same as the old fetch, but sets "isLoading" attribute before and after the fetch.
    isLoading:false,
    isFetched:false,
    fetch : function(options) {
      options || (options = {});
      var collection = this;
      var success = options.success;
      collection.isLoading = true;
      collection.trigger("fetch");
      console.log('about to fetch');
      options.dataType = "jsonp";
      options.success = function(resp, status, xhr) {
      	console.log('fetched');
        collection.isLoading = false;
        collection.isFetched = true;
        collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
        collection.trigger("loaded");
        if (success) success(collection, resp);
      };
      //options.error = hls.util.wrapError(options.error, collection, options);
      return (this.sync || Backbone.sync).call(this, 'read', this, options);
    },
    // //accesstoken helper
    // addAccessToken:function(data){
    //   return _.extend(data,this.accessToken());
    // },
    // //accesstoken helper
    // accessToken:function(){
    //   if(hls.user){
    //     return {single_access_token:hls.user.single_access_token};
    //   } else {
    //     return {};
    //   }
    // },
    unwrap:function(data, str){
      this.reset(hls.util.unwrap(data,str));
    },
    //a modification of reset
    //same as the old reset but sets isLoading and isFetched so we don't have to bother fetching it again
    reset : function(models, options) {
      models  || (models = []);
      options || (options = {});
      this.each(this._removeReference);
      this._reset();
      this.add(models, {silent: true});
      this.isFetched = true;
      this.isLoading = false;
      if (!options.silent) this.trigger('reset', this, options);
      return this;
    },

  });
hls.CarList = hls.Collection.extend({
  url: function(){
  	if(!this.user) throw new Error('CarList: A user must be specified');
    return hls.server+"/users/"+this.user.id+"/cars.json"
  },
  model:hls.Car,
  parse:function(response){
    return hls.util.unwrap(response, "car");

  },
});