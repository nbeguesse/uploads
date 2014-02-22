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
hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    takePicture:function(){
      if(navigator.camera){
        var api_type = "camera"
        if(api_type == "camera"){
            var options = { quality : 50,
              destinationType : Camera.DestinationType.FILE_URI,
              sourceType : Camera.PictureSourceType.CAMERA,
              allowEdit : true,
              encodingType: Camera.EncodingType.JPEG,
              //targetWidth: 100,
              //targetHeight: 100,
              saveToPhotoAlbum: true }
            navigator.camera.getPicture(this.cameraSuccess, this.cameraError, options)
        }
      } else {
        alert('Camera API not supported');
      }
    },
    cameraSuccess:function(data){
      console.log('got picture '+data);
      alert('Success: ' + data);
      this.trigger('gotPicture');
    },
    cameraError:function(message){
      alert('Failed because: ' + message);
      this.trigger('failedPicture');
    }
});
hls.Car = hls.Model.extend({
    initialize:function(){
        console.log('Creating Car:', this.attributes);
        this.showLink = "#cars/"+this.attributes.id
    },
    description:function(){
        var parts = [this.attributes.year, this.attributes.make, this.attributes.model];
        return parts.join(" ");
    }
});
hls.Image = hls.Model.extend({
    initialize:function(){
        console.log('Creating Image:', this.attributes);
        this.showLink = "#images/"+this.attributes.id
    },
});
hls.UserModel = hls.Model.extend({
     defaults:{
      id:null,
      single_access_token:null,
      first_name:null
     },
    initialize:function(){
        this.curr_car = new hls.Car({id:0});
        this.cars = new hls.CarList();
        this.cars.user = this;
        this.bind('change:id',this._login_or_out, this);
        return this;
    },
    logged_in:function(){
      return this.attributes.id != null;
    },
    _login_or_out:function(){
      console.log('User: User changed');
      if(this.logged_in()){ 
        this.cars.fetch();
        this.trigger('login'); //redraw homepage
      }
    },
});
hls.UserSession = hls.Model.extend({
  url: hls.server+"/user_sessions/create.json",
  login:function(){
    var data = $("#login-form").serialize();
    this.getUrl(this.url,{
        data:data,
        success:function(data){
          if(data.errors){
            //tell them why they can't login
            alert(data.errors[0]); 
          } else {
            //this will trigger login
            hls.user.set(data.user);
          }
        }
    });
  },
});