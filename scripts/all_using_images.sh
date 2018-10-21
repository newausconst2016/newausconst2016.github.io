#!/bin/bash

# Only run this in jekyll root
grep -r "projects/images" ./projects | sed "s/^.*projects\/images\///g" | sed "s/\"$//g" | sort -u
