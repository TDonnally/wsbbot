var words = [];
const time = new Date();
var hour = time.getHours();
var AMorPM = "AM"

function parseJson(){
    fetch('/cloud', {method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },}
    ).then((response)=>{
            return response.json();
        }).then((data) => {
            for(i=0;i<=19;i++){
              words.push({
                label: data[i]._id,
                y: data[i].frequency
              });
            }
            console.log(words);
        }).then(() => {
          document.getElementById("loading").style.opacity = "0";
          document.getElementById("chartContainer").style.opacity = "100";
          if(hour>12){
            AMorPM = "PM"
            hour = hour - 12;
          }
          else{
            AMorPM = "AM";
          }
          let chart = new CanvasJS.Chart("chartContainer", {
            dataPointMinWidth: 2,
            backgroundColor: "#E5FDFF",
            animationEnabled: true,
            theme: "light2",
            title: {
              text: "r/wallstreetbets word count from "+ hour + AMorPM + " to " + (hour + 1 + AMorPM)
            },
            axisX:{
              labelFontSize: 12,
              interval: 1
            },
            axisY: {
              title: "Frequency",
              titleFontSize: 24,
              labelFontSize: 12
            },
            data: [{
              type: "bar",
              yValueFormatString: "#,###",
              dataPoints: words.reverse()
            }]
          })
          chart.render();
          })
}
parseJson();
