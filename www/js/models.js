hls.CarList = null;
hls.ImageList = null;

hls.Model = Backbone.Model.extend({


});
hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    takePicture:function(){
     // if(navigator.camera){
      if(false){
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
      //fail silently!
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
        this.images.car = this;
        this.bind('sync',this._syncImages, this);
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
    },
    _syncImages:function(){
      console.log('in sync images');
      _.each(this.images.models, function(image){
        if(image.isNew()){
          image.save();
        }
      });
    },
});
hls.Image = hls.Model.extend({
    url:function(){
      return hls.server+"/cars/"+car.get('id')+"/upload_image.json"
    },
    initialize:function(){
        console.log('Creating Image:', this.attributes);
        return this;
    },
    save: function(){
      console.log('in save');
      if(FileTransfer){
        var ft = new FileTransfer();
        var imageURI = this.get('file_url');
        var options = new FileUploadOptions();
        options.fileKey="file";
        options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
        options.mimeType="image/jpeg";

        var params = {};
        params.value1 = "single_access_token";
        params.value2 = hls.user.get('single_access_token');

        options.params = params;

        ft.upload(imageURI, encodeURI(this.url), this.win, this.fail, options);
      }
    },
    win:function(r){
      console.log("Code = " + r.responseCode);
      alert("Response = " + r.response);
    },
    fail:function(error){
      alert("An error has occurred: Code = " + error.code);
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);

    }
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
      }
      this.trigger('login');
    },
});
