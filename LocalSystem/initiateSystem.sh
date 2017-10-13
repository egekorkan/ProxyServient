#!/bin/bash
COUNT=0
for i in *.js; do
    [ -f "$i" ] || break
    echo $COUNT
   	gnome-terminal --tab --geometry=100x10+0+$COUNT --title="$i" -e "bash -c \"node $i; exec bash\"" 
   	let "COUNT=$COUNT+250"
done

#node $i