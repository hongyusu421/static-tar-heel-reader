<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
% if use_sw and sw:
<meta name="theme-color" content="#99badd" />
% endif
% if embedcss:
<style>
  ${include('site.css')}
  ${include(css + '.css')}
</style>
% else:
<link rel="stylesheet" href="${copy('site.css')}" />
<link rel="stylesheet" href="${copy(css + '.css')}" />
% endif
<script src="${link(js + '.js')}"></script>
