class BiocViews < Nanoc3::DataSource

  require 'pp'
  require 'rubygems'
  require 'json'
  
  identifier :bioc_views
  
  # todo - write an index page for each repo containing links to all packages
  
  # todo - find out if there is a way to skip items() altogether if things are not found in up()
  def up
    @repos = {"bioc/" => "Software", "data/annotation/" => "AnnotationData", "data/experiment/" => "ExperimentData"}
    
    @good_to_go = true
    
    
    
    
    @repos.each_pair do |k,v|
      dir = "#{config[:json_dir]}/#{k}"
      @good_to_go = false unless test(?f, "#{dir}/packages.json") 
      
      #todo remove
      @good_to_go = false unless test(?f, "#{dir}/vignette_titles.json") 
      
      
    end
    
    @all_packages = {}
    
    if @good_to_go
      @repos.each_pair do |k,v|
        key = k.gsub(/\/$/, "")
        dir = "#{config[:json_dir]}/#{k}"
        json_file = File.open("#{dir}/packages.json")
        obj = JSON.parse(json_file.readlines.join("\n"))
        
        
        @all_packages[key] = obj
      end
    else
      puts "BiocViews data source: json files not present, skipping initialization"
    end
    
      
  end

  
  #todo remove
  def do_bad_stuff(obj, dir)
    tf = File.open("#{dir}/vignette_titles.json")
    json = tf.readlines.join("\n")
    vt = JSON.parse(json)
    
    obj.each_pair do |k,v|
      if (vt.has_key? k)
        v[:vignetteTitles] = [] unless v.has_key? :vignetteTitles
        
        if (vt[k].respond_to? :has_key?)
          v["vignetteFiles"] = v["vignetteTitles"]
          v[:vignetteFiles] = v[:vignetteTitles]
          
          v["vignetteTitles"] = vt[k]["vignetteTitles"] unless vt[k]["vignetteTitles"].nil? or vt[k]["vignetteTitles"].empty?
          v["vignetteScripts"] = vt[k]["vignetteScripts"] unless vt[k]["vignetteScripts"].nil? or vt[k]["vignetteScripts"].empty?
          
          v[:vignetteTitles] = v["vignetteTitles"]
          v[:vignetteScripts] = v["vignetteScripts"]
        end
        
        
      end
      
    end
    obj
  end
  # end remove
  
  def items
    
    unless @good_to_go
      puts "BiocViews_DataSource: no JSON file(s) found. Package detail pages will not be built"
      return []
    end

    items = []
    
    link_list = [:Depends, :Imports, :Suggests, :dependsOnMe, :importsMe, :suggestsMe]
    
    @repos.each_pair do |k,v|
      dir = "#{config[:json_dir]}/#{k}"
      json_file = File.open("#{dir}/packages.json")
      
      

    
        
      packages = JSON.parse(json_file.readlines.join("\n"))
      
      #todo remove
      packages = do_bad_stuff(packages,dir)
      # end remove
      
      
      for package in packages.keys
        repo = k
        item = Nanoc3::Item.new(nil, packages[package], package)
        
        item[:subnav] = []
        item[:subnav].push({:include => "/_workflows/"})
        item[:subnav].push({:include => "/_mailing_list/"})
        
        item[:title] = "#{item[:Package]}"
        item[:repo] = repo
        item[:bioc_version_str] = config[:version_str]
        item[:bioc_version_num] = config[:version_num]
        rep = Nanoc3::ItemRep.new(item, :unique_name)
        
        for sym in link_list
          new_sym = "#{sym.to_s}_repo".to_sym
          item[new_sym] = []
          for x in item[sym]
            item[new_sym].push(is_bioc_package?(x))
          end
        end
        
        
        items.push item
      end
    end
    items
  end
  
  # if "packageName" is a bioC package, return its repo directory, otherwise return false
  def is_bioc_package?(packageName)
    @all_packages.each_pair do |k,v|
      return k if v.has_key?(packageName)
    end
    false
  end
  
  
end
