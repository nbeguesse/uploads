hls.CarList = null;
hls.ImageList = null;

hls.Model = Backbone.Model.extend({


});
hls.Camera = hls.Model.extend({
    initialize:function(){
        return this;
    },
    scanVin:function(options){ //see https://github.com/wildabeast/BarcodeScanner 
      this.success = options.success;     
      if(!hls.emulated){
        cordova.plugins.barcodeScanner.scan( this.scanSuccess, this.scanError );
      } else {
        
        alert('Barcode API not supported. Using sample data.');
        this.scanSuccess({text:"1C6RR6LT1DS560200", format:"Code_39", cancelled:false});
      }
    },
    takePicture:function(options){
      this.success = options.success; 
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
      var image = new hls.Image({file_url:data});
      hls.user.get_curr_car().images.add(image);
      if(this.success){ this.success(result.text); }
    },
    cameraError:function(message){
      //fail silently!
    },
    scanSuccess:function(result){
      if(!result.cancelled){
        if(result.format=="Code_39" && result.text.length == 17) {
          console.log('we got a vin!');
          if(this.success){ this.success(result.text); }
        } else {
          alert("The VIN was only partially scanned. Please be sure to fit the entire barcode inside the window, and use a high pixel-density camera.");
        }
      }
    },
    scanError:function(message){
     //fail silently!
    },
});
hls.Car = hls.Model.extend({
   defaults:{
     year:null,
     make:null,
     make_id:null,
     model:null,
     model_id:null,
     style:null,
     style_id:null
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
        this.printLink = hls.server+"/cars/"+this.get('id')+"/window_sticker.pdf"
      }
        // this.images = new hls.ImageList(this.get('image_files')); 
        // this.images.car = this;
        // this.bind('sync',this._syncImages, this);
    },
    // parse: function(response){
    //   return response.car
    // },
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
    toParam:function(){
      return {
              year:this.get('year'),
              make:this.get('make') || "",
              make_id:this.get('make_id') || "",
              model:this.get('model') || "",
              model_id:this.get('model_id') || "",
              chrome_style_id:this.get('style_id') || ""              
            }
    },
    getInstalledOptions:function(){
       return _.filter(this.get('options'), function(i){ return i.installed; }                    
           );
    },
    getWasNewPrice:function(){
      var out = null;
      var msrp = this.get('msrp_price');
      if(msrp && msrp > 0){
        out = msrp;
        _.each(this.getInstalledOptions(), function(o){
          if(o.msrp){
            out += parseInt(o.msrp.highValue);
          }
        });
      }
      return out
    },
    // _syncImages:function(){
    //   console.log('in sync images');
    //   _.each(this.images.models, function(image){
    //     if(image.isNew()){
    //       image.save();
    //     }
    //   });
    // },
});
// hls.Image = hls.Model.extend({
//     url:function(){
//       return hls.server+"/cars/"+this.car.get('id')+"/upload_image.json"
//     },
//     initialize:function(){
//         return this;
//     },

//     save: function(fileEntry){
//       console.log('in save');
//       var imageURI = this.get('file_url');
//       if(navigator.camera){
//         alert(imageURI)
//         var options = new FileUploadOptions();
//         options.fileKey="file";
//         options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
//         options.mimeType="image/jpeg";

//         var params = {};
//         params.kind = "0";

//         options.params = params;

//         var ft = new FileTransfer();
//         ft.upload(imageURI, encodeURI(this.url()), this.win, this.fail, options);
//       }
//     },
//     win:function(r){
//       alert("Response = " + r.response);
//       if(JSON.parse(r.response).error){
//         alert("Upload Error: " + JSON.parse(r.response).error);
//       }
//     },
//     fail:function(error){
//       //alert("An upload error has occurred: Code = " + error.code);

//     }
// });

//Note: These functions only work on the device. It doesn't work on emulators.
//Use try/catch block and alert statements for debugging.
hls.File = hls.Model.extend({
  saveUser:function(){
    if(hls.emulated){
      console.log('skipping save to file system.');
    } else {
      try{
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, this._gotFSWrite, hls.util._fail);
      } catch (err){
        alert(err);
      }
   }
  },
  loadUser:function(){
    if(hls.emulated){
      console.log('skipping load from file system.');
    } else {
      try{
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, this._gotFSRead, hls.util._fail);
      } catch (err){
        alert(err);
      }

   }
  },
  logoutUser:function(){
    if(hls.emulated){
      console.log('skipping erasal from file system.');
    } else {
      try{
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, this._gotFSRemove, hls.util._fail);
      } catch (err){
        alert(err);
      }
   }
   hls.user = new hls.UserModel();

  },
  _gotFSRead:function(fileSystem){
    fileSystem.root.getFile("user.txt", null, hls.util._gotFileReadEntry, hls.util._fail);
  },
  _gotFSWrite:function(fileSystem){
    fileSystem.root.getFile("user.txt",  {create: true, exclusive: false}, hls.util._gotFileWriteEntry, hls.util._fail);
  },
  _gotFSRemove:function(fileSystem){
    fileSystem.root.getFile("user.txt", {create: false, exclusive: false}, hls.util._gotFileRemoveEntry, hls.util._fail);
  },
});
hls.UserModel = hls.Model.extend({
    initialize:function(){
        this.cars = new hls.CarList(); 
        this.cars.user = this;
        this.file = new hls.File();
        this.file.user = this;
        this.bind('change:id',this.cars.update, this.cars); //save temp cars on login
        return this;
    },
    getFileKey:function(){
      return "user";
    },
    //get the current car(may or may not be blank)
    get_curr_car:function(){
      if(!this.curr_car){
        this.curr_car = this.get_new_car(); //the current car to attach the images to
      }
      return this.curr_car;
    },
    //get a blank car
    get_new_car:function(){ 
      if(this.curr_car && this.curr_car.isNew()){
        return this.curr_car;
      }
      var temp = new hls.Car(); 
      this.cars.add(temp);
      return temp;
    },
    loadFromFile:function(){
      console.log('in load from file');
      var value = window.localStorage.getItem(this.getFileKey());
      if(!_.isString(value)){
        console.log('no data yet');
        return;
      }
      var data = JSON.parse(value);
      this.set(data.user);
      this.cars.set(data.user.cars, {remove:false});
      //reload the homepage using changePage instead of app.navigate since we are already on the homepage
      app.changePage(new hls.WelcomeView());
      console.log('got from file')
    },
    loggedIn:function(){
      return !this.isNew();
    },
    logout:function(){
      window.localStorage.clear();
      hls.user = new hls.UserModel();
      app.changePage(new hls.WelcomeView());
    },
    saveToFile:function(){
      var attributes = {user:this.attributes};
      //rewrite the car attribute to make sure it's the latest
      attributes.user.cars = _.map(this.cars.models, function(car){ return car.attributes; });
      window.localStorage.setItem(this.getFileKey(), JSON.stringify(attributes));
      console.log('wrote to file');
    },

    // _loginOrOut:function(){
    //   console.log('User: User changed');
    //   if(this.loggedIn()){ 
    //     this.cars.update(); 
    //   }
    //   this.trigger('login');
    // },
});
