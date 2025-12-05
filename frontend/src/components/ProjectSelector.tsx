import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { X, Plus, ChevronDown, FolderOpen } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { projectService, Project } from '../services/projectService';

interface ProjectSelectorProps {
  selectedProjectId?: string;
  selectedProjectName?: string;
  onSelectProject: (projectId?: string, projectName?: string) => void;
  placeholder?: string;
}

export default function ProjectSelector({
  selectedProjectId,
  selectedProjectName,
  onSelectProject,
  placeholder = 'Select or create project'
}: ProjectSelectorProps) {
  const { colors, isDarkMode } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];

  useEffect(() => {
    if (showModal) {
      loadProjects();
    }
  }, [showModal]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    onSelectProject(project.id, undefined);
    setShowModal(false);
    setCreatingNew(false);
  };

  const handleCreateNew = async () => {
    if (!newProjectName.trim()) return;

    // Just pass the name to parent - backend will handle findOrCreate
    onSelectProject(undefined, newProjectName.trim());
    setShowModal(false);
    setCreatingNew(false);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectColor('#3b82f6');
  };

  const handleClearSelection = () => {
    onSelectProject(undefined, undefined);
  };

  const getDisplayText = () => {
    if (selectedProjectName) {
      return selectedProjectName;
    }
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      return project?.name || 'Selected Project';
    }
    return placeholder;
  };

  const getProjectColor = () => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      return project?.color || '#3b82f6';
    }
    return '#3b82f6';
  };

  const selectedColor = (selectedProjectId || selectedProjectName) ? getProjectColor() : colors.text;

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          <FolderOpen size={20} color={selectedColor} />
          <Text 
            style={[
              styles.selectorText, 
              { 
                color: (selectedProjectId || selectedProjectName) ? selectedColor : colors.textSecondary 
              }
            ]}
          >
            {getDisplayText()}
          </Text>
        </View>
        <View style={styles.selectorRight}>
          {(selectedProjectId || selectedProjectName) && (
            <TouchableOpacity onPress={handleClearSelection} style={styles.clearButton}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <ChevronDown size={20} color={colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          setCreatingNew(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {creatingNew ? 'Create New Project' : 'Select Project'}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                setCreatingNew(false);
              }}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {!creatingNew ? (
              <ScrollView style={styles.projectList}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : (
                  <>
                    {projects.map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectItem,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          selectedProjectId === project.id && { borderColor: colors.primary, borderWidth: 2 }
                        ]}
                        onPress={() => handleSelectProject(project)}
                      >
                        <View style={[styles.projectColorDot, { backgroundColor: project.color || '#3b82f6' }]} />
                        <View style={styles.projectInfo}>
                          <Text style={[styles.projectName, { color: colors.text }]}>{project.name}</Text>
                          {project.description && (
                            <Text style={[styles.projectDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                              {project.description}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={[styles.createNewButton, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                      onPress={() => setCreatingNew(true)}
                    >
                      <Plus size={20} color={colors.primary} />
                      <Text style={[styles.createNewText, { color: colors.primary }]}>Create New Project</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            ) : (
              <View style={styles.createForm}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Project name *"
                  placeholderTextColor={colors.textSecondary}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                />

                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  placeholder="Description (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={newProjectDescription}
                  onChangeText={setNewProjectDescription}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.colorLabel, { color: colors.text }]}>Project Color</Text>
                <View style={styles.colorPicker}>
                  {predefinedColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newProjectColor === color && styles.colorOptionSelected
                      ]}
                      onPress={() => setNewProjectColor(color)}
                    />
                  ))}
                </View>

                <View style={styles.createFormButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      setCreatingNew(false);
                      setNewProjectName('');
                      setNewProjectDescription('');
                      setNewProjectColor('#3b82f6');
                    }}
                  >
                    <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      { backgroundColor: colors.primary },
                      !newProjectName.trim() && styles.createButtonDisabled
                    ]}
                    onPress={handleCreateNew}
                    disabled={!newProjectName.trim()}
                  >
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  projectList: {
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  projectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 14,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createForm: {
    padding: 20,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  createFormButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
