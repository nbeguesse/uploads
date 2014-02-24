hls.CarList = null;
hls.ImageList = null;

hls.Model = Backbone.Model.extend({


});
hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    viewGallery:function(){

    },
    takePicture:function(){
      if(navigator.camera){

        var options = { quality : 50,
          destinationType : Camera.DestinationType.FILE_URI,
          sourceType : Camera.PictureSourceType.CAMERA, //CAMERA or PHOTOLIBRARY
          allowEdit : true,
          encodingType: Camera.EncodingType.JPEG,
          saveToPhotoAlbum: false }
        navigator.camera.getPicture(this.cameraSuccess, this.cameraError, options)
    
      } else {
        alert('Camera API not supported. Using sample picture.');
        this.cameraSuccess("http://s3.amazonaws.com/highlinesale-beta-images/photos/67458/1104868/big.JPG?1393038514");
      }
    },
    cameraSuccess:function(data){
      alert(data);
      var image = new hls.Image({file_url:data});
      hls.user.get_curr_car().images.add(image);
      //this.trigger('gotPicture'); //this binding doesn't work in android emulator
      app.navigate(hls.user.curr_car.showLink+"?image=successful", {trigger: true});


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
      if(this.isNew()){
        this.showLink = "#cars/0";
        this.editLink = "#cars/0/edit";
      } else {
        this.showLink = "#cars/"+(this.get('id'));
        this.editLink = "#cars/"+(this.get('id'))+"/edit";
      }
        this.images = new hls.ImageList(this.get('image_files')); //TODO: put this in 2 steps
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
      return hls.server+"/cars/"+this.car.get('id')+"/upload_image.json"
    },
    toJSON: function() {
      //add params[:car] before saving the car
      var out = hls.util.addAccessToken(_.clone(this.attributes));
      return out;
    },
    initialize:function(){
        console.log('Creating Image:', this.attributes);
        return this;
    },
    save2:function(){
      //alert(this.get('file_url'));

      window.resolveLocalFileSystemURI(this.get('file_url'), this.save, function(){
            alert('Couldn\'t find image file.')
          }
          );


    },
    // save3:function(fileEntry){
    //   var form = $("form#n");
    //  // form.find('#file').val(fileEntry.fullPath);
    //   var formData = new FormData(form[0]);
    //   $.ajax({
    //       url: this.url,  //Server script to process data
    //       type: 'POST',
    //       xhr: function() {  // Custom XMLHttpRequest
    //           var myXhr = $.ajaxSettings.xhr();
    //           if(myXhr.upload){ // Check if upload property exists
    //              // myXhr.upload.addEventListener('progress',progressHandlingFunction, false); // For handling the progress of the upload
    //           }
    //           return myXhr;
    //       },
    //       //Ajax events
    //       success: function(){alert('!')},
    //       error: function(){alert(':(')},
    //       // Form data
    //       data: formData,
    //       //Options to tell jQuery not to process data or worry about content-type.
    //       cache: false,
    //       contentType: false,
    //       processData: false
    //   });
    // },
    save: function(fileEntry){
      console.log('in save');
      var imageURI = this.get('file_url');
      if(navigator.camera){
            alert(imageURI)
            var options = new FileUploadOptions();
            options.fileKey="file";
            options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
            options.mimeType="image/jpeg";

            var params = {};
            params.value1 = "test";
            params.value2 = "param";

            options.params = params;

            var ft = new FileTransfer();
            ft.upload(imageURI, encodeURI("http://some.server.com/upload.php"), this.win, this.fail, options);
      }
    },
    win:function(r){
      alert('success');
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
