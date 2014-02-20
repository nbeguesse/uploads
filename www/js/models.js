hls.CarList = null;

hls.Model = Backbone.Model.extend({
    getUrl:function(url, options){
      var model = this;
      var options = options;
      options || (options = {});
      options.data || (options.data = {});
      options.dataType || (options.dataType = "GET");
      var success = options.success;
      var error = options.error || this.defaultError;
      // if (ss.user && ss.user.mobile){
      //   options.data = addAccessToken(options.data)
      // }
      this.set({isLoadingUrl:true});
      $.mobile.loading('show');
      $.ajax({
        type: options.dataType,
        url: url,
        data:options.data,
        success:function(data){
          model.set({isLoadingUrl:false});
          $.mobile.loading('hide');
            if(success){ 
              success(data); 
            }
        },
        dataType: "jsonp"
      });
    },
    defaultError:function(){
      alert('There was an error contacting the server. Please try again later.');
    },
});
hls.Car = hls.Model.extend({
    initialize:function(){
        console.log('Creating Car:', this.attributes);
    },
    description:function(){
        var parts = [this.attributes.year, this.attributes.make, this.attributes.model];
        return parts.join(" ");
    }
});
hls.UserModel = hls.Model.extend({
     defaults:{
      id:null,
      single_access_token:null,
      first_name:null
     },
    initialize:function(){
        this.logged_in = false;
        console.log('Creating User:', this.attributes);
        this.bind('change',this._change, this)

        return this;
    },
    _change:function(){
      this.logged_in = true;
      console.log('User: User changed');
      if(!this.cars){
        this.cars = new hls.CarList();
        this.cars.user = this;
        this.cars.bind('loaded', this._updateCarList, this);
        this.cars.fetch();
      }
    },
    _updateCarList:function(){
      console.log('User: Car List updated');
      this.trigger('reload')

    }
});
hls.UserSession = hls.Model.extend({
  url: hls.server+"/user_sessions/create.json",
  login:function(){
    var data = $("#login-form").serialize();
    this.getUrl(this.url,{
        data:data,
        success:function(data){
          if(data.errors){
            alert(data.errors[0]); //tell them why they can't login
          } else {
            hls.user.set(data.user);
          }
        }
    });
  },
});