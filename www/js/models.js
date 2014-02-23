hls.CarList = null;
hls.ImageList = null;

hls.Model = Backbone.Model.extend({
    getUrl:function(url, options){
      var model = this;
      var options = options;
      options || (options = {});
      options.data || (options.data = {});
      options.dataType || (options.dataType = "GET");
      var success = options.success;
      //var error = options.error || this.defaultError;
      if (hls.user.loggedIn()){
        options.data = this.addAccessToken(options.data)
      }
      //this.set({isLoadingUrl:true});
      $.mobile.loading('show'); //show jquery mobile spinner
      $.ajax({
        dataType: "json",
        url: url,
        data:options.data,
        success:function(data){
         // model.set({isLoadingUrl:false});
          if(data.login_error){
            console.log('Couldn\'t login.');
          }
          $.mobile.loading('hide'); //hide jquery mobile spinner
            if(success){ 
              success(data); 
            }
        },
        error:function(data){
          alert('There was an error contacting the server. Please try again later.');
          $.mobile.loading('hide');
        }
        
      });
    },

});
hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    takePicture:function(){
      if(navigator.camera){
        var options = { quality : 50,
          destinationType : Camera.DestinationType.FILE_URI,
          sourceType : Camera.PictureSourceType.CAMERA,
          allowEdit : true,
          encodingType: Camera.EncodingType.JPEG,
          //targetWidth: 640,
          //targetHeight: 480,
          saveToPhotoAlbum: true }
        navigator.camera.getPicture(this.cameraSuccess, this.cameraError, options)
    
      } else {
        alert('Camera API not supported. Using sample picture.');
        this.cameraSuccess("http://s3.amazonaws.com/highlinesale-beta-images/photos/67458/1104868/big.JPG?1393038514");
      }
    },
    cameraSuccess:function(data){
      var image = new hls.Image({file_url:data});
      hls.user.get_curr_car().images.add(image);
      this.trigger('gotPicture');

    },
    cameraError:function(message){
      //alert('Failed because: ' + message);
    }
});
hls.Car = hls.Model.extend({
  defaults:{
    year:1996,
    make:'Nissan'
  },
    url: function(){
      if(this.isNew()){
        return hls.server+"/cars";
      } else {
        return hls.server+"/cars/"+this.get('id')+".json";
      }
    },
    initialize:function(){
        this.showLink = "#cars/"+this.get('id');
        this.editLink = "#cars/"+this.get('id')+"/edit";
        this.images = new hls.ImageList(this.get('image_files'));
    },
    parse: function(response){
      return response.car
    },
    toJSON: function() {
      //add params[:car] before saving the car
      var out = hls.util.addAccessToken({ car: _.clone( this.attributes ) });
      return out;
    },
    description:function(){
        var parts = [this.get('year'), this.get('make'), this.get('model')];
        var out = parts.join(" ");
        if(out=="  "){ out = "Your Car"}
        return out;
    }
});
hls.Image = hls.Model.extend({
    initialize:function(){
        console.log('Creating Image:', this.attributes);
        return this;
    },
});
hls.UserModel = hls.Model.extend({
    initialize:function(){
        this.cars = new hls.CarList(); 
        this.cars.user = this;
        this.bind('change:id',this._loginOrOut, this);
        return this;
    },
    get_curr_car:function(){
      if(!this.curr_car){
        this.curr_car = new hls.Car(); //the current car to attach the images to
        this.cars.add(this.curr_car);
      }
      return this.curr_car;
    },
    loggedIn:function(){
      return !this.isNew();
    },
    _loginOrOut:function(){
      console.log('User: User changed');
      if(this.loggedIn()){ 
        this.cars.update();
        this.trigger('login'); 
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