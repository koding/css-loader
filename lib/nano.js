var decamelize = require('decamelize');
var defined = require('defined');
var assign = require('object-assign');
var postcss = require('postcss');

// Processors
var postcssFilterPlugins = require('postcss-filter-plugins');
var postcssDiscardComments = require('postcss-discard-comments');
var postcssReduceInitial = require('postcss-reduce-initial');
var postcssMinifyGradients = require('postcss-minify-gradients');
var postcssSvgo = require('postcss-svgo');
var postcssReduceTransforms = require('postcss-reduce-transforms');
var autoprefixer = require('autoprefixer');
var postcssZindex = require('postcss-zindex');
var postcssConvertValues = require('postcss-convert-values');
var postcssCalc = require('postcss-calc');
var postcssColormin = require('postcss-colormin');
var postcssOrderedValues = require('postcss-ordered-values');
var postcssMinifySelectors = require('postcss-minify-selectors');
var postcssMinifyParams = require('postcss-minify-params');
var postcssNormalizeCharset = require('postcss-normalize-charset');
var postcssMinifyFontValues = require('postcss-minify-font-values');
var postcssDiscardUnused = require('postcss-discard-unused');
var postcssNormalizeUrl = require('postcss-normalize-url');
var postcssMergeIdents = require('postcss-merge-idents');
var postcssReduceIdents = require('postcss-reduce-idents');
var postcssMergeLonghand = require('postcss-merge-longhand');
var postcssDiscardDuplicates = require('postcss-discard-duplicates');
var postcssDiscardOverridden = require('postcss-discard-overridden');
var postcssMergeRules = require('postcss-merge-rules');
var postcssDiscardEmpty = require('postcss-discard-empty');
var postcssUniqueSelectors = require('postcss-unique-selectors');


var functionOptimiser = require('cssnano/dist/lib/functionOptimiser');
var filterOptimiser = require('cssnano/dist/lib/filterOptimiser');
var reduceBackgroundRepeat = require('cssnano/dist/lib/reduceBackgroundRepeat');
var reducePositions = require('cssnano/dist/lib/reducePositions');
var core = require('cssnano/dist/lib/core');
var reduceTimingFunctions = require('cssnano/dist/lib/reduceTimingFunctions');
var styleCache = require('cssnano/dist/lib/styleCache');

/**
 * Deprecation warnings
 */

var warnOnce = require('cssnano/dist/lib/warnOnce');

var processors = {
  postcssFilterPlugins: function() { return postcssFilterPlugins({silent: true}) },
  postcssDiscardComments: postcssDiscardComments,
  postcssMinifyGradients: postcssMinifyGradients,
  postcssReduceInitial: postcssReduceInitial,
  postcssSvgo: postcssSvgo,
  postcssReduceTransforms: postcssReduceTransforms,
  autoprefixer: autoprefixer,
  postcssZindex: postcssZindex,
  postcssConvertValues: postcssConvertValues,
  reduceTimingFunctions: reduceTimingFunctions,
  postcssCalc: postcssCalc,
  postcssColormin: postcssColormin,
  postcssOrderedValues: postcssOrderedValues,
  postcssMinifySelectors: postcssMinifySelectors,
  postcssMinifyParams: postcssMinifyParams,
  postcssNormalizeCharset: postcssNormalizeCharset,
  postcssDiscardOverridden: postcssDiscardOverridden,
  // minify-font-values should be run before discard-unused
  postcssMinifyFontValues: postcssMinifyFontValues,
  postcssDiscardUnused: postcssDiscardUnused,
  postcssNormalizeUrl: postcssNormalizeUrl,
  functionOptimiser: functionOptimiser,
  filterOptimiser: filterOptimiser,
  reduceBackgroundRepeat: reduceBackgroundRepeat,
  reducePositions: reducePositions,
  core: core,
  // Optimisations after this are sensitive to previous optimisations in
  // the pipe, such as whitespace normalising/selector re-ordering
  postcssMergeIdents: postcssMergeIdents,
  postcssReduceIdents: postcssReduceIdents,
  postcssMergeLonghand: postcssMergeLonghand,
  postcssDiscardDuplicates: postcssDiscardDuplicates,
  postcssMergeRules: postcssMergeRules,
  postcssDiscardEmpty: postcssDiscardEmpty,
  postcssUniqueSelectors: postcssUniqueSelectors,
  styleCache: styleCache,
};

var defaultOptions = {
  autoprefixer: {
    add: false,
  },
  postcssConvertValues: {
    length: false,
  },
  postcssNormalizeCharset: {
    add: false,
  },
};

var safeOptions = {
  postcssConvertValues: {
    length: false,
  },
  postcssDiscardUnused: {
    disable: true,
  },
  postcssMergeIdents: {
    disable: true,
  },
  postcssReduceIdents: {
    counterStyle: false,
    keyframes: false,
  },
  postcssNormalizeUrl: {
    stripWWW: false,
  },
  postcssZindex: {
    disable: true,
  },
};

var nanoPluginHandler = function nanoPluginHandler (options) {
  if (typeof options === 'undefined') options = {}

  // Prevent PostCSS from throwing when safe is defined
  if (options.safe === true) {
    options.isSafe = true;
    options.safe = null;
  }

  var safe = options.isSafe;
  var proc = postcss();

  if (typeof options.fontFamily !== 'undefined' || typeof options.minifyFontWeight !== 'undefined') {
    warnOnce('The fontFamily & minifyFontWeight options have been ' +
             'consolidated into minifyFontValues, and are now deprecated.');
    if (!options.minifyFontValues) {
      options.minifyFontValues = options.fontFamily;
    }
  }

  if (typeof options.singleCharset !== 'undefined') {
    warnOnce('The singleCharset option has been renamed to ' +
             'normalizeCharset, and is now deprecated.');
    options.normalizeCharset = options.singleCharset;
  }

  Object.keys(processors).forEach(function(plugin) {
    var shortName = plugin.replace('postcss', '');
    shortName = shortName.slice(0, 1).toLowerCase() + shortName.slice(1);

    var opts = defined(
      options[shortName],
      options[plugin],
      options[decamelize(plugin, '-')]
    );

    if (opts === false) {
      opts = {disable: true};
    }

    opts = assign({},
                  defaultOptions[plugin],
                  safe ? safeOptions[plugin] : null,
                  opts
                 );

                 if (!opts.disable) {
                   proc.use(processors[plugin](opts));
                 }

  });

  return proc;
}

var cssnano = postcss.plugin('cssnano', nanoPluginHandler)


cssnano.process = function (css, options) {
  if (typeof options === 'undefined') options = {}
  options.map = options.map || (options.sourcemap ? true : null);
  return postcss([cssnano(options)]).process(css, options);
};

module.exports = cssnano;
