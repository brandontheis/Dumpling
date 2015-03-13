package org.apache.solr.handler.component;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.BooleanClause.Occur;
import org.apache.solr.common.params.SolrParams;
import org.apache.solr.request.SolrQueryRequest;
import org.apache.solr.response.ResultContext;
import org.apache.solr.response.SolrQueryResponse;
import org.apache.solr.search.SolrIndexSearcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

public class WinWinQueryComponent extends QueryComponent {
  protected static Logger log = LoggerFactory.getLogger(QueryComponent.class);
  
  private Map<String,Object> session;
  private final static String PREVIOUS_QUERY = "PREVIOUS_QUERY";
  private final static String[] STATE_NAMES = {
     "RELEVANT_EXPLOITATION"
    ,"RELEVANT_EXPLORATION"
    ,"NONRELEVANT_EXPLOITATION"
    ,"NONRELEVANT_EXPLORATION"
  };
  private final static String STATE_PROBABILITY = "STATE_PROBABILITY";
  
  public WinWinQueryComponent() {
    super();
    session = new HashMap<String,Object>();
  }
  
  @Override
  public void process(ResponseBuilder rb) throws IOException {
    SolrQueryRequest req = rb.req;
    SolrQueryResponse rsp = rb.rsp;
    SolrParams params = req.getParams();
    
    SolrIndexSearcher searcher = req.getSearcher();
    SolrIndexSearcher.QueryCommand cmd = rb.getQueryCommand();
    SolrIndexSearcher.QueryResult result = new SolrIndexSearcher.QueryResult();
    
    HttpServletRequest httpReq = (HttpServletRequest) req.getContext().get(
        "httpRequest");
    if (httpReq != null) {
      SolrIndexSearcher.QueryCommand previousCmd = (SolrIndexSearcher.QueryCommand) httpReq
          .getSession().getAttribute("PREVIOUS_QUERY");
      
      if (inferCurrentState().indexOf("EXPLORATION")!=-1){
        absorbPreviousCmd(cmd, previousCmd);
      } 
      
      httpReq.getSession().setAttribute("PREVIOUS_QUERY", cmd);
    }
    
    session.put(PREVIOUS_QUERY, cmd);
    
    searcher.search(result, cmd);
    rb.setResult(result);
    
    ResultContext ctx = new ResultContext();
    ctx.docs = rb.getResults().docList;
    ctx.query = rb.getQuery();
    rsp.add("response", ctx);
    rsp.getToLog().add("hits", rb.getResults().docList.matches());
  }
  
  float deminishedImpact = (float) 0.5;
  
  private void absorbPreviousCmd(SolrIndexSearcher.QueryCommand currentCmd,
      SolrIndexSearcher.QueryCommand previousCmd) {
    if (previousCmd == null) return;
    Query currentQuery = currentCmd.getQuery();
    Query previousQuery = previousCmd.getQuery();
    currentCmd.setQuery(combine(currentQuery, 1, previousQuery,
        deminishedImpact));
  }
  
  private Query combine(Query q1, float impact1, Query q2, float impact2) {
    BooleanQuery newQuery = new BooleanQuery();
    List newQueryClauses = newQuery.clauses();
    
    absorb(newQuery, q1, impact1);
    absorb(newQuery, q2, impact2);
    return newQuery;
  }
  
  private void absorb(BooleanQuery query, Query absorbedQuery, float impact) {
    float boost = query.getBoost() * impact;
    if (impact > 0.1) {
      if (absorbedQuery instanceof TermQuery) {
        absorb(query, (TermQuery) absorbedQuery, impact);
      } else if (absorbedQuery instanceof BooleanQuery) {
        absorb(query, (BooleanQuery) absorbedQuery, impact);
      }
    }
  }
  
  private void absorb(BooleanQuery query, TermQuery absorbedQuery, float impact){
    List queryClauses = query.clauses();
    Query tempQuery = absorbedQuery.clone();
    float boost = tempQuery.getBoost() * impact;
    if (boost > 0.1) {
      tempQuery.setBoost(boost);
      BooleanClause newClause = new BooleanClause(tempQuery, Occur.SHOULD);
      queryClauses.add(newClause);
    }
  }
  
  private void absorb(BooleanQuery query, BooleanQuery absorbedQuery,
      float impact) {
    List newQueryClauses = query.clauses();
    List absorbedClauses = absorbedQuery.clauses();
    
    for (int i = 0; i < absorbedClauses.size(); i++) {
      BooleanClause absorbedClause = (BooleanClause) absorbedClauses.get(i);
      if (absorbedClause.getOccur().equals(BooleanClause.Occur.SHOULD)
          || absorbedClause.getOccur().equals(BooleanClause.Occur.MUST)) {
        Query tempQuery = absorbedClause.getQuery().clone();
        float boost = tempQuery.getBoost() * impact;
        if (boost > 0.1) {
          tempQuery.setBoost(boost);
          BooleanClause newClause = new BooleanClause(tempQuery, Occur.SHOULD);
          newQueryClauses.add(newClause);
        }
      }
    }
  }
  
  final float transitionProbability[][] = {
      {0f,1.00f,0.0f,0.0f}
      ,{0f,1.00f,0.0f,0.0f}
      ,{0f,1.00f,0.0f,0.0f}
      ,{0f,1.00f,0.0f,0.0f}
  };
  
  final float startProbability[] = {0.0f,1.0f,0.0f,0.0f};
  
  private String inferCurrentState(){
    float previousP[] = new float[4];
    if (session.get(STATE_PROBABILITY)!=null){
      previousP = (float[])session.get(STATE_PROBABILITY);
    } else {
      session.put(STATE_PROBABILITY,startProbability);
      return STATE_NAMES[0];
    }
    
    // Calculate current states' probabilities.
    float currentP[] = new float[4];
    for (int i=0; i<4; i++) {
      currentP[i]= previousP[i];
      for (int j=0; j<4; j++) {
        currentP[i]+=transitionProbability[j][i];
      }
    }
    
    // Normalize probability.
    float sum = 0;
    for (int i=0; i<4; i++){
      sum+=currentP[i];
    }
    for (int i=0; i<4; i++){
      currentP[i]=currentP[i]/sum;
    }
 
    session.put(STATE_PROBABILITY,currentP);
    
    int max=0; 
    for (int i=1; i<4; i++){
      if (currentP[i]>currentP[max]) {
        max = i;
      }
    }
    
    return STATE_NAMES[max];
  }
  
}
