window.hls = {};
hls.user = null;

hls.HlsModel = Backbone.Model.extend({
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
hls.Car = Backbone.Model.extend({
    initialize:function(){
        console.log('Creating Car:', this.attributes);
    },
    description:function(){
        var parts = [this.attributes.year, this.attributes.make, this.attributes.model];
        return parts.join(" ");
    }
});
hls.UserModel = Backbone.Model.extend({
    initialize:function(){
        console.log('Creating User:', this.attributes);
        this.cars = new hls.CarList( this.attributes.own_cars);
        this.cars.user = this;
        //TODO: Save User in local storage, then use to initialize hls.user
    }
});
hls.UserSession = hls.HlsModel.extend({
  url:"http://localhost:3000/user_sessions/create.json",
  login:function(){
    var data = $("#login-form").serialize();
    this.getUrl(this.url,{
        data:data,
        success:function(data){
          if(data.errors){
            alert(data.errors[0]); //tell them why they can't login
          } else {
            hls.user = new hls.UserModel(data.user);
            app.navigate("login",true);
          }
        }
    });
  },
});



hls.CarList = Backbone.Collection.extend({
  model:hls.Car
});


hls.HomeView = Backbone.View.extend({
    events: {
      'click button.login': '_login'
    },
    template:_.template($('#home').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    },
    _login:function(e){
        e.preventDefault();
        var session = new hls.UserSession();
        session.login();
        return;
    }
});
hls.UserView = Backbone.View.extend({

    render:function (eventName) {
        var template = _.template($('#user').html(),{user:this.model});
        $(this.el).html(template);
        return this;
    }
});
hls.Page1View = Backbone.View.extend({

    template:_.template($('#page1').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

hls.Page2View = Backbone.View.extend({

    template:_.template($('#page2').html()),

    render:function (eventName) {
        $(this.el).html(this.template());
        return this;
    }
});

hls.AppRouter = Backbone.Router.extend({

    routes:{
        "":"home",
        "login":"login",
        "page1":"page1",
        "page2":"page2",

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
        if(hls.user){
            this.changePage(new hls.UserView({model:hls.user}));
        } else {
            this.changePage(new hls.HomeView());
        }
    },
    login:function () {
        console.log('#login');
        if(hls.user){
            this.changePage(new hls.UserView({model:hls.user}));
        } else {
            this.changePage(new hls.HomeView());
        }
    },
    page1:function () {
        console.log('#page1');
        this.changePage(new hls.Page1View());
    },

    page2:function () {
        console.log('#page2');
        this.changePage(new hls.Page2View());
    },

    changePage:function (page) {
        $(page.el).attr('data-role', 'page');
        page.render();
        $('body').append($(page.el));
        var transition = $.mobile.defaultPageTransition;
        // We don't want to slide the first page
        if (this.firstPage) {
            transition = 'none';
            this.firstPage = false;
        }
        $.mobile.changePage($(page.el), {changeHash:false, transition: transition});
    }

});

$(document).ready(function () {
    console.log('document ready');
    app = new hls.AppRouter();
    Backbone.history.start();
});