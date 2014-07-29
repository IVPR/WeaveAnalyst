package weave.servlets;

import static weave.config.WeaveConfig.initWeaveConfig;

import java.rmi.RemoteException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;

import org.apache.commons.io.FilenameUtils;
import org.json.simple.JSONObject;
import org.python.google.common.primitives.Ints;
import org.rosuda.REngine.REXP;
import org.rosuda.REngine.REXPDouble;
import org.rosuda.REngine.REXPList;
import org.rosuda.REngine.REXPLogical;
import org.rosuda.REngine.REXPMismatchException;
import org.rosuda.REngine.REXPString;
import org.rosuda.REngine.REXPUnknown;
import org.rosuda.REngine.RFactor;
import org.rosuda.REngine.RList;
import org.rosuda.REngine.Rserve.RConnection;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.internal.StringMap;

import weave.beans.WeaveRecordList;
import weave.config.WeaveContextParams;
import weave.servlets.WeaveServlet;
import weave.utils.AWSUtils;
import weave.utils.ListUtils;
import weave.utils.SQLUtils.WhereClause.NestedColumnFilters;

import weave.config.AwsContextParams;
import weave.models.computations.AwsRService;
import weave.models.computations.AwsStataService;
import weave.models.computations.ScriptResult;

public class ComputationalServlet extends WeaveServlet
{	
	public ComputationalServlet() throws Exception
	{
		rService = new AwsRService();
	}
	
	private String programPath = "";
	private String tempDirPath = "";
	private String stataScriptsPath = "";
	private String rScriptsPath = "";
	private AwsRService rService = null;
	public void init(ServletConfig config) throws ServletException
	{
		super.init(config);
		initWeaveConfig(WeaveContextParams.getInstance(config.getServletContext()));
		programPath = AwsContextParams.getInstance(config.getServletContext()).getStataPath();
		tempDirPath = FilenameUtils.concat(AwsContextParams.getInstance(config.getServletContext()).getAwsConfigPath(), "temp");
		
		stataScriptsPath = AwsContextParams.getInstance(config.getServletContext()).getStataScriptsPath();
		rScriptsPath = AwsContextParams.getInstance(config.getServletContext()).getRScriptsPath();
	}

	private static final long serialVersionUID = 1L;

	public Object runScript(String scriptName, StringMap<Object> scriptInputs, NestedColumnFilters filters) throws Exception
	{
		Object resultData = null;
		ScriptResult result = new ScriptResult();
		
 		long startTime = 0; 
 		long endTime = 0;
 		long time1 = 0;
 		long time2 = 0;
 		
 		// Start the timer for the data request
 		startTime = System.currentTimeMillis();

 		StringMap<Object> input = new StringMap<Object>();
 		ArrayList<Integer> colIds = new ArrayList<Integer>();
 		ArrayList<String> colNames = new ArrayList<String>();
 		
		for(String key : scriptInputs.keySet()) {
			
			Object value = scriptInputs.get(key);
			
			if(value instanceof String) {
				input.put(key, value);
			} else if (value instanceof Number) {
				input.put(key, value);
			} else if (value instanceof Boolean) {
				input.put(key, value);
			} else if (value instanceof StringMap<?>){
				// collect the names and id for single query below
				colNames.add(key);
				colIds.add((Integer) ((Double) ( (StringMap<Object>) scriptInputs.get(key)).get("id")).intValue());
			} else if (value instanceof Object[]) {
				
				ArrayList<Integer> ids = new ArrayList<Integer>();
				Object[] values = (Object[]) value;
				for(int i = 0; i < values.length; i++)
				{	
					StringMap<Object> strMap = (StringMap<Object>) values[i];
					ids.add((Integer) ((Double) strMap.get("id")).intValue());
				}
				
				WeaveRecordList data = null;
				data = DataService.getFilteredRows(Ints.toArray(ids), filters, null);
				input.put(key, data);
			}
		}
		
		// use the collection of ids from above to retrieve the data.
		WeaveRecordList data = DataService.getFilteredRows(Ints.toArray(colIds), filters, null);
	
		// transpose the data to obtain the column form
		Object[][] columnData = (Object[][]) AWSUtils.transpose((Object)data.recordData);

		// assign each columns to proper column name
		for(int i =  0; i < colNames.size(); i++) {
			input.put(colNames.get(i), columnData[i]);
		}
		
		endTime = System.currentTimeMillis();
		
		time1 = endTime - startTime;
		
		startTime = System.currentTimeMillis();
		
		if(AWSUtils.getScriptType(scriptName) == AWSUtils.SCRIPT_TYPE.R) 
		{
			resultData = rService.runScript(FilenameUtils.concat(rScriptsPath, scriptName), input);
		} else {
			resultData = AwsStataService.runScript(scriptName, input,
					 programPath, tempDirPath, stataScriptsPath);

		}
		
 		time2 = endTime - startTime;
		result.data = resultData;
	 	result.times[0] = time1;
	 	result.times[1] = time2;
		return result;
	}
}