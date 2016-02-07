var _ = require( 'lodash' );
var path = require( 'path' );
var webpack = require( 'webpack' );
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var pkg = require('./package.json');

var pathAppTo;

function pathTo() {
    return path.join( __dirname, 'src', path.join.apply( path, arguments ) );
}

pathAppTo = _.partial( pathTo, 'app' );

module.exports = function ( options ) {
    var config = _.merge( {}, {
        devServer: {
            contentBase: path.join( __dirname, 'src' ),
            publicPath: '/',
            hot: true,
            inline: true,
            historyApiFallback: true,
            stats: {
                colors: true
            },
            stats: 'errors-only',
            progress: true,
            proxy: {
                '/api/v1/*': 'http://localhost:9000'
            },
            host: '0.0.0.0',
            port: 8080
        },
        entry: {
            vendor: _.reject(_.keys(pkg.dependencies), function(v) {
                return _.includes(['bootstrap-markdown', 'font-awesome'], v)
            }).concat([
                'assets/css/bootstrap-cosmo.css',
                'font-awesome/css/font-awesome.min.css',
                'bootstrap-markdown/js/bootstrap-markdown',
                'ladda/dist/ladda.min.css',
                'assets/css/animate.css',
            ])
        },

        output: {
            path: path.join( __dirname, 'build' ),
            filename: '[name].js'
        },
        plugins: [
            new HtmlWebpackPlugin({
              template: 'src/index.ejs',
              inject: false
            }),
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NoErrorsPlugin(),
            new webpack.ProvidePlugin( {
                jQuery: 'jquery',
                $: 'jquery',
                'window.jQuery': 'jquery'
            } ),
            new CopyWebpackPlugin([
                { from: './src/favicon.ico' },
                { from: './assets/img/*.png' },
                { from: './assets/img/*.jpg' },
                { from: './assets/img/*.svg' }
            ]),
            new webpack.optimize.CommonsChunkPlugin( 'vendor', 'vendor.js' )
        ],
        resolve: {
            extensions: [ '', '.js', '.jsx', '.styl' ],
            alias: {
                //application aliases
                actions: pathAppTo( 'actions' ),
                components: pathAppTo( 'components' ),
                lib: pathAppTo( 'lib' ),
                mixins: pathAppTo( 'mixins' ),
                modals: pathAppTo( 'modals' ),
                models: pathAppTo( 'models' ),
                resources: pathAppTo( 'resources' ),
                services: pathAppTo( 'services' ),
                stores: pathAppTo( 'stores' ),
                views: pathAppTo( 'views' ),
                utils: pathAppTo( 'utils' ),
                parts: pathAppTo( 'parts' ),

                assets: pathTo( 'assets' ),
                config: pathAppTo( 'config.js' ),

                //vendor aliases
                jquery: 'jquery/dist/jquery.min.js'
            }
        },
        module: {
            loaders: [
                { test: /\.css$/, loader: 'style-loader!css-loader' },
                { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
                { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
                {
                    test: /\.jpg|\.png|\.mp3/,
                    loader: 'file-loader'
                },
                {
                    test: /\.styl$/,
                    loader: 'style-loader!css-loader!stylus-loader'
                }
            ]
        },
        resolveLoader: {
            root: path.join( __dirname, 'node_modules' )
        }
    }, options.overrides );

    config.module.loaders = _.union( config.module.loaders, options.loaders );
    config.plugins = _.union( config.plugins, options.plugins );
    return config;
};
