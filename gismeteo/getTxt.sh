#!/bin/sh

gisRes=$(curl -s -H 'X-Gismeteo-Token: 61f2622ed09418.03179533' 'https://api.gismeteo.net/v2/weather/current/4368/?lang=ru');
echo $gisRes;
json_parse < $gisRes;

