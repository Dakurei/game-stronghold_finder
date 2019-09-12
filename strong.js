var moreMeasurements = "Ajoutez 2 mesures ou plus pour chercher un Stronghold !";

function load() {
    canvas = document.getElementById("map");
    ctx = canvas.getContext("2d");
    document.getElementById('results').innerHTML = moreMeasurements;
}

function deleteMeasurements() {
    var opts = document.getElementById('measurement_list');
    var selected = opts.selectedOptions;
    for(var ii=selected.length-1; ii>=0; ii--) {
        opts.removeChild(selected[ii]);
    }
    refreshMap();
}

function newMeasurementButton() {
    var x1 = parseFloat(document.getElementById('x1').value);
    var x2 = parseFloat(document.getElementById('x2').value);
    var y1 = parseFloat(document.getElementById('y1').value);
    var y2 = parseFloat(document.getElementById('y2').value);
    addMeasurement(x1,x2,y1,y2);
    clearMeasurement();
    refreshMap();
}

function addMeasurement(x1, x2, y1, y2) {
    var optionText = "("+x1+","+y1+") vers ("+x2+","+y2+")";
    var option = document.createElement("option");
    option.appendChild(document.createTextNode(optionText));
    option.x1 = x1;
    option.x2 = x2;
    option.y1 = y1;
    option.y2 = y2;
    option.className = 'measurement';
    document.getElementById("measurement_list").appendChild(option);
}

function clearMeasurement() {
    document.getElementById('x1').value = '';
    document.getElementById('x2').value = '';
    document.getElementById('y1').value = '';
    document.getElementById('y2').value = '';
}

function refreshMap() {
    var measurements = document.getElementsByClassName('measurement');
    ctx.clearRect(0,0,canvas.width, canvas.height)
    if(measurements.length < 2) {
        document.getElementById('results').innerHTML = moreMeasurements;
        document.getElementById('result_box').className = "warning";
        return;
    }
    var A=0,B=0,C=0,D=0,E=0,F=0;
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    for(var ii=0; ii<measurements.length; ii++) {
        var current = measurements[ii];
        minx = Math.min(minx,Math.min(current.x1,current.x2))
        miny = Math.min(miny,Math.min(current.y1,current.y2))
        maxx = Math.max(maxx,Math.max(current.x1,current.x2))
        maxy = Math.max(maxy,Math.max(current.y1,current.y2))
        var dirx = current.x2-current.x1;
        var diry = current.y2-current.y1;
        var norm = Math.sqrt(dirx*dirx+diry*diry);
        current.dirx = dirx/norm;
        current.diry = diry/norm;
        A += diry*diry;
        B += -dirx*diry;
        D += dirx*dirx;
        var cross = current.x1*diry-current.y1*dirx;
        E += diry*cross;
        F += -dirx*cross;
    }
    var determinant = A*D-B*B;
    var eig_avg = 0.5*(A+D);
    var eig_diff = Math.sqrt((A-D)*(A-D)/4+B*B);
    var matrix_condition = (eig_avg+eig_diff)/(eig_avg-eig_diff);
    if(matrix_condition < 1e-3) {
        solx = NaN;
        soly = NaN;
    } else {
        var solx = (E*D-B*F)/determinant;
        minx = Math.min(minx, solx);
        maxx = Math.max(maxx, solx);
        var soly = (A*F-B*E)/determinant;
        miny = Math.min(miny, soly);
        maxy = Math.max(maxy, soly);
    }
    ctx.save();
    var scale = 0.8/Math.max((maxx-minx)/canvas.width,
                            (maxy-miny)/canvas.height);
    ctx.scale(scale, scale);
    ctx.lineWidth = 1./scale;
    ctx.font = '' + 20./scale + 'px serif';
    ctx.translate(0.5*(canvas.width/scale-minx-maxx),
                  0.5*(canvas.height/scale-miny-maxy));
    for(var ii=0; ii<measurements.length; ii++) {
        var current = measurements[ii];
        ctx.beginPath()
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.moveTo(current.x1,current.y1);
        ctx.lineTo(current.x2,current.y2);
        ctx.stroke();
        var arrowLength = 10/scale, arrowWidth = 5/scale;
        ctx.beginPath();
        ctx.moveTo(current.x2,current.y2);
        ctx.lineTo(current.x2-arrowLength*current.dirx-arrowWidth*current.diry,
                   current.y2-arrowLength*current.diry+arrowWidth*current.dirx);
        ctx.lineTo(current.x2-arrowLength*current.dirx+arrowWidth*current.diry,
                   current.y2-arrowLength*current.diry-arrowWidth*current.dirx);
        ctx.lineTo(current.x2,current.y2);
        ctx.fill();
    }
    if(!isNaN(solx)) {
        var crossSize = 5 / scale;
        ctx.beginPath();
        ctx.moveTo(solx-crossSize,soly);
        ctx.lineTo(solx+crossSize,soly);
        ctx.moveTo(solx,-crossSize+soly);
        ctx.lineTo(solx,+crossSize+soly);
        ctx.stroke();
        document.getElementById('results').innerHTML = 
            'Stronghold aux alentours de:<br/><strong>X: '+Math.round(solx)+
            ', Z: '+Math.round(soly)+'</strong>';
            document.getElementById('result_box').className = "success";
    } else {
        document.getElementById('results').innerHTML = 'Impossible d\'estimer la position du Stronghold. Essayez d\'espacer un peu plus vos mesures.';
        document.getElementById('result_box').className = "error";
    }
    ctx.restore();
}
