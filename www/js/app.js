function checkIfFileExists(path){
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem){
        fileSystem.root.getFile(path, { create: false }, fileExists, fileDoesNotExist);
    }, getFSFail); //of requestFileSystem
}
function fileExists(fileEntry){
    alert("File " + fileEntry.fullPath + " exists!");
}
function fileDoesNotExist(){
    alert("file does not exist");
}
function getFSFail(evt) {
    console.log(evt.target.error.code);
}


$.support.cors = true;
hls.View = Backbone.View.extend({
    getUrl:function(url, options){
      var options = options;
      options || (options = {});
      var success = options.success;
      // if (hls.user.loggedIn()){
      //   options.data = hls.util.addAccessToken(options.data)
      // }
      $.mobile.loading('show'); //show jquery mobile spinner
      $.ajax({
        dataType: "json",
        url: url,
        data:options.data,
        success:function(data){
          // if(data.login_error){
          //   console.log('Couldn\'t login.');
          // }
          $.mobile.loading('hide'); //hide jquery mobile spinner
            if(success){ 
              success(data); 
            }
        },
        
      });
    },
    //generalized form submitting & validation method. 
    //Define onFormSubmit for when it succeeds.
    submitForm:function(form, onFormSubmit){
      var data = form.serialize();
      var success = onFormSubmit;
      this.getUrl(form.attr('action'),{
        data:data,
        success:function(data){
            if(data.errors){
              alert(data.errors[0]); 
            } else {
              success(data);
            }
        }
      });
    },
    //The normal render function will not include the jQuery mobile styling 
    //so use this specific callback instead of render()
    _render:function(){
         this.render(); //redraw HTML template
         $(this.el).trigger("create"); //trigger Jquery Mobile styling
    },
});
hls.TestView = hls.View.extend({
  events: {
    'click button':'_click'
  },
  initialize:function(){
    hls.user = new hls.UserModel({id:3905, single_access_token:"unRPEMrx5CthGMhLDSb"});
    hls.user.curr_car = new hls.Car({id:67459, year:1996, make:"Nissan"});
    //content://com.android.providers.media.documents/document/image%3A22 => content://media/external/images/media/22(thru gallery)
    hls.image = new hls.Image({file_url:"content://media/external/images/media/22"});
    hls.user.curr_car.images.add(hls.image);
  },
  render:function(){
    $(this.el).html('<form id="n"><input type="hidden" name="single_access_token" value="unRPEMrx5CthGMhLDSb"><input type="file" id="file" name="file" size="10" value=""/></form><button>Click here</button>')
  },
  _click:function(){
    hls.image.save("m");
  }
});
hls.HomeView = hls.View.extend({
    events: {
      'click a.login': '_login'
    },
    initialize:function(){
        this.model.bind('login', this._render, this);
        return this;
    },
    render:function (eventName) {
      if(hls.user.loggedIn()){
        //logged-in view
        var template = _.template($('#user').html(),{user:hls.user});
        $(this.el).html(template);
        var carlistView = new hls.CarlistView({model: hls.user.cars });
        $('.carlist-holder', this.el).append(carlistView.render().el);
      } else {
        //not-logged-in view
        var template = _.template($('#home').html());
        $(this.el).html(template);
      }
      return this;
    },
    _render:function(){
        //force entire page to reload on login and logout
        app.changePage(new hls.HomeView({model:hls.user})); 
    },
    _login:function(e){
        this.submitForm($("#login-form"), function(data){
             hls.user.set(data.user);
        });
    },
});

hls.CarlistView = hls.View.extend({
    initialize:function(){
        this.model.bind('sync', this._render, this);
        return this;
    },
    render:function (eventName) {
      var template = _.template($('#carlist').html(),{cars:this.model});
      $(this.el).html(template);
      return this;
    },
});

hls.CarView = Backbone.View.extend({
    initialize:function(){
        return this;
    },    
    render:function (eventName) {
        var template = _.template($('#car').html(), {car:this.model})
        $(this.el).html(template);
        return this;
    }
});

hls.WelcomeView = hls.View.extend({
    events: {
      'click button.take-picture': '_takePicture'
    },
    initialize:function(){
    //    hls.camera.bind('gotPicture', this._tookPicture, this); //this binding doesnt work in android emulator
        return this;
    },    
    render:function (eventName) {
        var template = _.template($('#welcome').html())
        $(this.el).html(template);
        return this;
    },
    _takePicture:function(){
        
        hls.camera.takePicture();
    },
    //_tookPicture:function(){
    //    app.navigate(hls.user.curr_car.showLink+"?image=successful", {trigger: true});
   // }
});

hls.AppRouter = Backbone.Router.extend({
    routes:{
        "":"test",
        "login":"home",
        "cars/:id":"cars",

    },
    initialize:function () {
        // Handle back button throughout the application
        $('.back').live('click', function(event) {
            window.history.back();
            return false;
        });
        this.firstPage = true;
    },

    home:function () {
        console.log('#home');
        this.changePage(new hls.HomeView({model:hls.user}));
        
    },

    cars:function(id) {
        console.log('#cars');
        var car = hls.user.cars.get(id); //find car in carlist
        if(_.isUndefined(car)){ car = hls.user.get_curr_car();} //if it's not found, they need to login
        this.changePage(new hls.CarView({model:car}));
    },
    test:function () {
        console.log('#welcome');
        this.changePage(new hls.TestView({model:hls.user}));
        
    },
    welcome:function () {
        console.log('#welcome');
        this.changePage(new hls.WelcomeView({model:hls.user.curr_car}));
        
    },
    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        $.mobile.changePage($(page.el), {changeHash:false});
        if(currentPage){ currentPage.remove(); }
        currentPage = page;
    }

});

$(document).ready(function () {
    console.log('document ready');
    currentPage = null;
    app = new hls.AppRouter();
    Backbone.history.start();
});